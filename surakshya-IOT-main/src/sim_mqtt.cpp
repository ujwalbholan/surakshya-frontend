#include <HardwareSerial.h>

#include "device_config.h"
#include "sim_mqtt.h"

extern HardwareSerial SimSerial;

namespace {

bool simAtBusy = false;
int simAtBusyDepth = 0;
bool simDataActive = false;
bool simMqttServiceStarted = false;
bool simMqttConnected = false;
bool simDiagnosticsLogged = false;
unsigned long lastSimMqttAttemptAt = 0;

struct SimAtGuard {
  SimAtGuard() { beginSimAtUse(); }
  ~SimAtGuard() { endSimAtUse(); }
};

void flushSimInput() {
  while (SimSerial.available() > 0) {
    SimSerial.read();
  }
}

void appendSimInput(String &response, unsigned long drainMs) {
  const unsigned long startedAt = millis();
  while (millis() - startedAt < drainMs) {
    while (SimSerial.available() > 0) {
      response += static_cast<char>(SimSerial.read());
    }
    delay(10);
  }
}

String readSimResponse(unsigned long timeoutMs, const char *expectedUrcPrefix = nullptr) {
  String response;
  const unsigned long startedAt = millis();
  while (millis() - startedAt < timeoutMs) {
    while (SimSerial.available() > 0) {
      response += static_cast<char>(SimSerial.read());
    }

    const bool hasOk = response.indexOf("\r\nOK") >= 0 || response.indexOf("\nOK") >= 0;
    const bool hasError = response.indexOf("ERROR") >= 0;
    const bool hasExpectedUrc =
        expectedUrcPrefix == nullptr || response.indexOf(expectedUrcPrefix) >= 0;
    const bool hasConnectUrc = response.indexOf("+CMQTTCONNECT:") >= 0;

    if (hasConnectUrc) {
      appendSimInput(response, 500);
      if (hasOk || hasError) {
        break;
      }
    }

    if (hasError) {
      appendSimInput(response, 500);
      break;
    }

    if (hasOk && hasExpectedUrc) {
      appendSimInput(response, 500);
      break;
    }

    delay(10);
  }

  if (response.indexOf("CMQTTCONNLOST") >= 0) {
    simMqttConnected = false;
  }

  return response;
}

String sendAtCommand(const char *command, unsigned long timeoutMs = SIM_AT_TIMEOUT_MS,
                     const char *expectedUrcPrefix = nullptr) {
  flushSimInput();

  Serial.printf("SIM >> %s\n", command);
  SimSerial.print(command);
  SimSerial.print("\r\n");

  const String response = readSimResponse(timeoutMs, expectedUrcPrefix);
  if (response.length() > 0) {
    Serial.printf("SIM << %s\n", response.c_str());
  } else {
    Serial.println("SIM << (no response)");
  }

  return response;
}

bool sendAtWithRawPayload(const char *command, const char *payload, size_t payloadLength,
                          unsigned long timeoutMs) {
  flushSimInput();

  Serial.printf("SIM >> %s\n", command);
  SimSerial.print(command);
  SimSerial.print("\r\n");

  String response;
  bool gotPrompt = false;
  const unsigned long startedAt = millis();
  while (millis() - startedAt < timeoutMs) {
    while (SimSerial.available() > 0) {
      const char c = static_cast<char>(SimSerial.read());
      response += c;
      if (c == '>') {
        gotPrompt = true;
      }
    }

    if (gotPrompt) {
      break;
    }
  }

  if (!gotPrompt) {
    Serial.println("SIM << missing prompt");
    return false;
  }

  SimSerial.write(reinterpret_cast<const uint8_t *>(payload), payloadLength);

  response = readSimResponse(timeoutMs);
  if (response.length() > 0) {
    Serial.printf("SIM << %s\n", response.c_str());
  }

  return response.indexOf("OK") >= 0 && response.indexOf("ERROR") < 0;
}

bool atResponseSucceeded(const String &response) {
  return response.indexOf("OK") >= 0 && response.indexOf("ERROR") < 0;
}

int parseUrcResultCode(const String &response, const char *prefix) {
  const int prefixIndex = response.indexOf(prefix);
  if (prefixIndex < 0) {
    return -1;
  }

  const int colonIndex = response.indexOf(':', prefixIndex);
  if (colonIndex < 0) {
    return -1;
  }

  int index = colonIndex + 1;
  while (index < static_cast<int>(response.length()) &&
         (response[index] == ' ' || response[index] == '\r' || response[index] == '\n')) {
    index++;
  }

  String digits;
  while (index < static_cast<int>(response.length()) && isDigit(response[index])) {
    digits += response[index];
    index++;
  }

  if (digits.length() == 0) {
    return -1;
  }

  return digits.toInt();
}

bool parseCmqttStartResult(const String &response) {
  const int resultCode = parseUrcResultCode(response, "+CMQTTSTART:");
  if (resultCode == 0) {
    return true;
  }

  if (resultCode > 0) {
    Serial.printf("SIM MQTT: CMQTTSTART error code %d\n", resultCode);
    return false;
  }

  return atResponseSucceeded(response);
}

bool parseCmqttConnectResult(const String &response) {
  const int errCode = parseUrcResultCode(response, "+CMQTTCONNECT:");
  if (errCode < 0) {
    return atResponseSucceeded(response);
  }

  if (errCode != 0) {
    Serial.printf("SIM MQTT: CMQTTCONNECT error code %d\n", errCode);
    return false;
  }

  return true;
}

bool isSimRegistered() {
  sendAtCommand("AT+CREG=1", 2000);
  sendAtCommand("AT+CEREG=1", 2000);

  const String regResponse = sendAtCommand("AT+CREG?", 3000);
  const String epsResponse = sendAtCommand("AT+CEREG?", 3000);

  const bool gsmRegistered =
      regResponse.indexOf(",1") >= 0 || regResponse.indexOf(",5") >= 0;
  const bool lteRegistered =
      epsResponse.indexOf(",1") >= 0 || epsResponse.indexOf(",5") >= 0;

  return gsmRegistered || lteRegistered;
}

bool isSimPacketAttached() {
  const String attachResponse = sendAtCommand("AT+CGATT?", 5000);
  return attachResponse.indexOf("+CGATT: 1") >= 0;
}

bool verifySimPdpActive() {
  const String cgactResponse = sendAtCommand("AT+CGACT?", 3000);
  if (cgactResponse.indexOf("1,1") < 0) {
    return false;
  }

  const String addrResponse = sendAtCommand("AT+CGPADDR=1", 3000);
  if (addrResponse.indexOf("+CGPADDR:") < 0) {
    return false;
  }

  if (addrResponse.indexOf("0.0.0.0") >= 0) {
    return false;
  }

  return true;
}

void logSimMqttDiagnostics() {
  if (simDiagnosticsLogged) {
    return;
  }

  simDiagnosticsLogged = true;
  Serial.println("SIM MQTT: collecting module diagnostics...");
  sendAtCommand("AT+CGMR", 3000);
  sendAtCommand("AT+CGACT?", 3000);
  sendAtCommand("AT+CGPADDR=1", 3000);
  sendAtCommand("AT+CGATT?", 3000);
}

void cleanupSimMqttSession() {
  char command[48];

  snprintf(command, sizeof(command), "AT+CMQTTDISC=%d,120", SIM_MQTT_CLIENT_INDEX);
  sendAtCommand(command, 10000);

  snprintf(command, sizeof(command), "AT+CMQTTREL=%d", SIM_MQTT_CLIENT_INDEX);
  sendAtCommand(command, 5000);

  sendAtCommand("AT+CMQTTSTOP", 10000);
  delay(300);

  simMqttConnected = false;
  simMqttServiceStarted = false;
}

bool activateSimPdpContext() {
  char apnCommand[64];
  snprintf(apnCommand, sizeof(apnCommand), "AT+CGDCONT=1,\"IP\",\"%s\"", SIM_APN);
  sendAtCommand(apnCommand, 3000);

  const String activateResponse = sendAtCommand("AT+CGACT=1,1", SIM_DATA_ACTIVATE_TIMEOUT_MS);
  if (!atResponseSucceeded(activateResponse)) {
    Serial.println("SIM MQTT: failed to activate PDP context.");
    return false;
  }

  if (!verifySimPdpActive()) {
    Serial.println("SIM MQTT: PDP active but no usable IP address.");
    return false;
  }

  simDataActive = true;
  return true;
}

bool ensureSimDataConnection() {
  const String atResponse = sendAtCommand("AT", 3000);
  if (!atResponseSucceeded(atResponse)) {
    Serial.println("SIM MQTT: module not responding.");
    return false;
  }

  sendAtCommand("ATE0", 2000);
  sendAtCommand("AT+CMEE=2", 2000);

  const String pinResponse = sendAtCommand("AT+CPIN?", 3000);
  if (pinResponse.indexOf("READY") < 0) {
    Serial.println("SIM MQTT: SIM not ready.");
    return false;
  }

  if (!isSimRegistered()) {
    Serial.println("SIM MQTT: SIM not registered on network.");
    return false;
  }

  const String attachResponse = sendAtCommand("AT+CGATT=1", 10000);
  if (!atResponseSucceeded(attachResponse)) {
    Serial.println("SIM MQTT: failed to attach packet service.");
    return false;
  }

  if (!isSimPacketAttached()) {
    Serial.println("SIM MQTT: packet service not attached.");
    return false;
  }

  return activateSimPdpContext();
}

bool ensureSimDataReady() {
  if (simDataActive && verifySimPdpActive()) {
    return true;
  }

  simDataActive = false;
  return ensureSimDataConnection();
}

bool startSimMqttService() {
  const String response =
      sendAtCommand("AT+CMQTTSTART", SIM_MQTT_START_TIMEOUT_MS, "+CMQTTSTART:");
  if (!parseCmqttStartResult(response)) {
    return false;
  }

  simMqttServiceStarted = true;
  return true;
}

bool recoverSimMqttService() {
  Serial.println("SIM MQTT: recycling PDP and MQTT service...");

  cleanupSimMqttSession();
  sendAtCommand("AT+CGACT=0,1", 10000);
  delay(1000);

  if (!activateSimPdpContext()) {
    return false;
  }

  delay(500);
  cleanupSimMqttSession();
  delay(500);
  return startSimMqttService();
}

bool connectSimMqtt() {
  if (simMqttConnected) {
    return true;
  }

  if (millis() - lastSimMqttAttemptAt < MQTT_RECONNECT_INTERVAL_MS) {
    return false;
  }

  lastSimMqttAttemptAt = millis();

  if (!ensureSimDataReady()) {
    return false;
  }

  Serial.printf("Connecting SIM MQTT to tcp://%s:%u ...\n", MQTT_BROKER_HOST, MQTT_BROKER_PORT);

  cleanupSimMqttSession();

  if (!startSimMqttService() && !recoverSimMqttService()) {
    Serial.println("SIM MQTT: CMQTTSTART failed.");
    logSimMqttDiagnostics();
    cleanupSimMqttSession();
    simDataActive = verifySimPdpActive();
    return false;
  }

  char acquireCommand[96];
  snprintf(acquireCommand, sizeof(acquireCommand), "AT+CMQTTACCQ=%d,\"%s\"",
           SIM_MQTT_CLIENT_INDEX, SIM_MQTT_CLIENT_ID);
  String response = sendAtCommand(acquireCommand, 5000);
  if (!atResponseSucceeded(response)) {
    Serial.println("SIM MQTT: CMQTTACCQ failed.");
    cleanupSimMqttSession();
    return false;
  }

  char cfgCommand[48];
  snprintf(cfgCommand, sizeof(cfgCommand), "AT+CMQTTCFG=\"version\",%d,4", SIM_MQTT_CLIENT_INDEX);
  response = sendAtCommand(cfgCommand, 3000);
  if (!atResponseSucceeded(response)) {
    Serial.println("SIM MQTT: CMQTTCFG version failed.");
    cleanupSimMqttSession();
    return false;
  }

  char connectCommand[160];
  snprintf(connectCommand, sizeof(connectCommand), "AT+CMQTTCONNECT=%d,\"tcp://%s:%u\",60,1",
           SIM_MQTT_CLIENT_INDEX, MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  response = sendAtCommand(connectCommand, SIM_MQTT_CONNECT_TIMEOUT_MS, "+CMQTTCONNECT:");
  if (!parseCmqttConnectResult(response)) {
    Serial.println("SIM MQTT: CMQTTCONNECT failed.");
    cleanupSimMqttSession();
    return false;
  }

  simMqttConnected = true;
  Serial.println("SIM MQTT connected.");
  return true;
}

}  // namespace

bool isSimAtBusy() {
  return simAtBusy;
}

void beginSimAtUse() {
  simAtBusyDepth++;
  simAtBusy = true;
}

void endSimAtUse() {
  simAtBusyDepth--;
  simAtBusy = simAtBusyDepth > 0;
}

bool publishSimMqtt(const char *topic, const char *payload) {
  SimAtGuard guard;
  lastSimMqttAttemptAt = 0;

  const size_t topicLength = strlen(topic);
  const size_t payloadLength = strlen(payload);

  char topicCommand[48];
  snprintf(topicCommand, sizeof(topicCommand), "AT+CMQTTTOPIC=%d,%u", SIM_MQTT_CLIENT_INDEX,
           static_cast<unsigned>(topicLength));

  char payloadCommand[48];
  snprintf(payloadCommand, sizeof(payloadCommand), "AT+CMQTTPAYLOAD=%d,%u", SIM_MQTT_CLIENT_INDEX,
           static_cast<unsigned>(payloadLength));

  char publishCommand[32];
  snprintf(publishCommand, sizeof(publishCommand), "AT+CMQTTPUB=%d,0,60", SIM_MQTT_CLIENT_INDEX);

  for (uint8_t attempt = 0; attempt < 2; attempt++) {
    if (!connectSimMqtt()) {
      return false;
    }

    if (!sendAtWithRawPayload(topicCommand, topic, topicLength, 10000)) {
      Serial.println("SIM MQTT: CMQTTTOPIC failed.");
      cleanupSimMqttSession();
      lastSimMqttAttemptAt = 0;
      continue;
    }

    if (!sendAtWithRawPayload(payloadCommand, payload, payloadLength, 10000)) {
      Serial.println("SIM MQTT: CMQTTPAYLOAD failed.");
      cleanupSimMqttSession();
      lastSimMqttAttemptAt = 0;
      continue;
    }

    const String publishResponse = sendAtCommand(publishCommand, 20000);
    if (!atResponseSucceeded(publishResponse)) {
      Serial.println("SIM MQTT: CMQTTPUB failed.");
      cleanupSimMqttSession();
      lastSimMqttAttemptAt = 0;
      continue;
    }

    Serial.printf("SIM MQTT published %s -> %s\n", topic, payload);
    return true;
  }

  return false;
}

void disconnectSimMqtt() {
  SimAtGuard guard;
  if (!simMqttConnected && !simMqttServiceStarted) {
    return;
  }

  cleanupSimMqttSession();
  simDataActive = false;
}

bool isSimMqttConnected() {
  return simMqttConnected;
}

void notifySimMqttConnectionLost() {
  if (!simMqttConnected) {
    return;
  }

  simMqttConnected = false;
  Serial.println("SIM MQTT: +CMQTTCONNLOST — will reconnect on next publish.");
}

void maintainSimMqtt() {
  if (simAtBusy || simMqttConnected) {
    return;
  }

  SimAtGuard guard;
  connectSimMqtt();
}

void prepareSimForSos() {
  if (simAtBusy) {
    return;
  }

  Serial.println("Preparing SIM data for SOS...");
  SimAtGuard guard;

  ensureSimDataReady();

  if (!simMqttConnected) {
    lastSimMqttAttemptAt = 0;
    connectSimMqtt();
  }
}
