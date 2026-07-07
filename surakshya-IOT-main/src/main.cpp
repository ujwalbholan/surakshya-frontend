#include <Arduino.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <Wire.h>
#include <time.h>

#include "device_config.h"
#include "motion.h"
#include "sim_mqtt.h"

HardwareSerial GpsSerial(2);
HardwareSerial SimSerial(1);
TinyGPSPlus gps;
LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, LCD_COLUMNS, LCD_ROWS);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastBlinkAt = 0;
unsigned long lastStatusAt = 0;
unsigned long lastSimStatusAt = 0;
unsigned long lastButtonChangeAt = 0;
unsigned long firstSosClickAt = 0;
unsigned long sosCountdownStartedAt = 0;
unsigned long lastSosLcdAt = 0;
unsigned long lastSosLocationSentAt = 0;
unsigned long lastMqttReconnectAttempt = 0;
unsigned long lastWifiReconnectAttempt = 0;
unsigned long lastWifiScanLogAt = 0;
bool wifiOperationInProgress = false;
unsigned long buttonPressedAt = 0;
bool ledOn = false;
bool timeConfigured = false;
bool lastButtonReading = HIGH;
bool stableButtonState = HIGH;
bool sosCountdownActive = false;
bool sosTrackingActive = false;
bool sosBuzzerActive = false;
bool longPressHandled = false;
bool simModuleResponsive = false;
uint8_t sosClickCount = 0;
bool emergencyComboActive = false;
bool emergencyCallTriggered = false;
bool callInProgress = false;
bool bothButtonsGesture = false;
unsigned long bothButtonsPressedAt = 0;
unsigned long lastCallButtonChangeAt = 0;
unsigned long callButtonPressedAt = 0;
unsigned long firstCallButtonClickAt = 0;
bool lastCallButtonReading = HIGH;
bool stableCallButtonState = HIGH;
bool callButtonLongPressHandled = false;
uint8_t callButtonClickCount = 0;
unsigned long callHangupHoldStartedAt = 0;

bool isEmergencyComboActive() {
  return emergencyComboActive || bothButtonsGesture;
}

bool isSosUiActive() {
  return sosCountdownActive || sosTrackingActive || sosBuzzerActive;
}

void writeLcdLine(uint8_t row, const char *message) {
  char padded[LCD_COLUMNS + 1];
  snprintf(padded, sizeof(padded), "%-16.16s", message);
  lcd.setCursor(0, row);
  lcd.print(padded);
}

void blinkLed() {
  if (millis() - lastBlinkAt < BLINK_INTERVAL_MS) {
    return;
  }

  lastBlinkAt = millis();
  ledOn = !ledOn;
  digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
}

const char *wifiStatusToString(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS:
      return "idle";
    case WL_NO_SSID_AVAIL:
      return "SSID not found (use 2.4 GHz network)";
    case WL_SCAN_COMPLETED:
      return "scan completed";
    case WL_CONNECTED:
      return "connected";
    case WL_CONNECT_FAILED:
      return "connect failed (wrong password?)";
    case WL_CONNECTION_LOST:
      return "connection lost";
    case WL_DISCONNECTED:
      return "disconnected";
    default:
      return "unknown";
  }
}

void logNearbyWifiNetworks() {
  if (millis() - lastWifiScanLogAt < WIFI_SCAN_LOG_INTERVAL_MS) {
    return;
  }
  lastWifiScanLogAt = millis();

  WiFi.disconnect(true, true);
  WiFi.mode(WIFI_STA);
  delay(250);

  Serial.println("Scanning for nearby WiFi networks...");
  const int networkCount = WiFi.scanNetworks(/*async=*/false, /*show_hidden=*/true);
  if (networkCount <= 0) {
    Serial.println("No WiFi networks found. Move closer to the router or check the ESP32 antenna.");
    return;
  }

  Serial.printf("Found %d network(s):\n", networkCount);
  for (int i = 0; i < networkCount; i++) {
    const String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) {
      continue;
    }

    Serial.printf(
        "  %s  RSSI=%d dBm  ch=%d  %s\n",
        ssid.c_str(),
        WiFi.RSSI(i),
        WiFi.channel(i),
        WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "open" : "secured");
  }
  WiFi.scanDelete();
}

bool connectWifi() {
  wifiOperationInProgress = true;
  Serial.printf("Connecting to WiFi SSID: %s\n", WIFI_SSID);
  writeLcdLine(0, "Connecting WiFi");
  writeLcdLine(1, WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);
  WiFi.disconnect(true, true);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    const wl_status_t status = WiFi.status();
    if (status == WL_NO_SSID_AVAIL || status == WL_CONNECT_FAILED) {
      Serial.printf("WiFi status: %s\n", wifiStatusToString(status));
      break;
    }

    blinkLed();
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf(
        "WiFi connection failed (%s). ESP32 requires 2.4 GHz WiFi.\n",
        wifiStatusToString(WiFi.status()));
    logNearbyWifiNetworks();
    writeLcdLine(0, "WiFi Failed");
    writeLcdLine(1, "Check config");
    wifiOperationInProgress = false;
    return false;
  }

  Serial.println("WiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.printf("RSSI: %d dBm, channel: %d\n", WiFi.RSSI(), WiFi.channel());
  writeLcdLine(0, "WiFi Connected");
  writeLcdLine(1, WiFi.localIP().toString().c_str());
  wifiOperationInProgress = false;
  return true;
}

void configureTimeFromWifi() {
  configTime(GMT_OFFSET_SECONDS, DAYLIGHT_OFFSET_SECONDS, "pool.ntp.org", "time.nist.gov");
  timeConfigured = true;
  Serial.println("NTP time sync configured.");

  struct tm timeInfo;
  for (uint8_t attempt = 0; attempt < 20; attempt++) {
    if (getLocalTime(&timeInfo, 500)) {
      char formattedTime[40];
      strftime(formattedTime, sizeof(formattedTime), "%Y-%m-%dT%H:%M:%S+05:45", &timeInfo);
      Serial.printf("Local time ready: %s\n", formattedTime);
      return;
    }
    delay(500);
  }

  Serial.println("Local time not synced yet. SOS MQTT timestamps may fail briefly.");
}

void readGps() {
  while (GpsSerial.available() > 0) {
    gps.encode(GpsSerial.read());
  }
}

void flushSimInput() {
  while (SimSerial.available() > 0) {
    SimSerial.read();
  }
}

String sendAtCommand(const char *command, unsigned long timeoutMs = SIM_AT_TIMEOUT_MS) {
  beginSimAtUse();
  flushSimInput();

  Serial.printf("SIM >> %s\n", command);
  SimSerial.print(command);
  SimSerial.print("\r\n");

  String response;
  const unsigned long startedAt = millis();
  while (millis() - startedAt < timeoutMs) {
    while (SimSerial.available() > 0) {
      response += static_cast<char>(SimSerial.read());
    }

    if (response.indexOf("OK") >= 0 || response.indexOf("ERROR") >= 0) {
      delay(100);
      while (SimSerial.available() > 0) {
        response += static_cast<char>(SimSerial.read());
      }
      break;
    }
  }

  response.trim();
  if (response.length() > 0) {
    Serial.printf("SIM << %s\n", response.c_str());
  } else {
    Serial.println("SIM << (no response)");
  }

  endSimAtUse();
  return response;
}

void resetSimModule() {
  if (SIM_RST_PIN < 0) {
    return;
  }

  pinMode(SIM_RST_PIN, OUTPUT);
  digitalWrite(SIM_RST_PIN, HIGH);
  delay(100);
  digitalWrite(SIM_RST_PIN, LOW);
  delay(200);
  digitalWrite(SIM_RST_PIN, HIGH);
  delay(2000);
}

void readSimSpontaneousMessages() {
  if (isSimAtBusy() || SimSerial.available() == 0) {
    return;
  }

  String urc;
  while (SimSerial.available() > 0) {
    urc += static_cast<char>(SimSerial.read());
  }

  if (urc.indexOf("CMQTTCONNLOST") >= 0) {
    notifySimMqttConnectionLost();
  }

  Serial.print("SIM URC << ");
  Serial.println(urc);
}

void initSimModule() {
  Serial.printf(
      "Starting SIM on RX GPIO%d, TX GPIO%d at %lu baud\n",
      SIM_RX_PIN,
      SIM_TX_PIN,
      SIM_BAUD);
  SimSerial.begin(SIM_BAUD, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
  delay(1000);

  resetSimModule();

  Serial.println();
  Serial.println("--- SIM bring-up test ---");
  const String atResponse = sendAtCommand("AT", 3000);
  sendAtCommand("ATE0", 2000);

  if (atResponse.indexOf("OK") >= 0) {
    simModuleResponsive = true;
    writeLcdLine(0, "SIM responding");
    writeLcdLine(1, "Check Serial");
  } else {
    simModuleResponsive = false;
    writeLcdLine(0, "SIM no response");
    writeLcdLine(1, "Check wiring");
  }
}

bool isWifiConnected() {
  return WiFi.status() == WL_CONNECTED;
}

const char *getPreferredSosChannel() {
  return "sim";
}

void initMqtt() {
  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setBufferSize(MQTT_BUFFER_SIZE);
}

bool formatIsoTimestamp(char *buffer, size_t bufferSize) {
  struct tm timeInfo;
  if (timeConfigured && getLocalTime(&timeInfo, 500)) {
    strftime(buffer, bufferSize, "%Y-%m-%dT%H:%M:%S+05:45", &timeInfo);
    return true;
  }

  const bool gpsDateLooksReal =
      gps.date.isValid() &&
      gps.time.isValid() &&
      gps.date.year() >= 2020 &&
      gps.date.month() >= 1 &&
      gps.date.day() >= 1;

  if (!gpsDateLooksReal) {
    return false;
  }

  int year = gps.date.year();
  int month = gps.date.month();
  int day = gps.date.day();
  int hour = gps.time.hour() + 5;
  int minute = gps.time.minute() + 45;
  int second = gps.time.second();

  if (second >= 60) {
    second -= 60;
    minute++;
  }
  if (minute >= 60) {
    minute -= 60;
    hour++;
  }
  if (hour >= 24) {
    hour -= 24;
    day++;
  }

  snprintf(buffer, bufferSize, "%04d-%02d-%02dT%02d:%02d:%02d+05:45", year, month, day, hour, minute, second);
  return true;
}

bool ensureMqttConnected() {
  if (!isWifiConnected()) {
    return false;
  }

  if (mqttClient.connected()) {
    return true;
  }

  if (millis() - lastMqttReconnectAttempt < MQTT_RECONNECT_INTERVAL_MS) {
    return false;
  }

  lastMqttReconnectAttempt = millis();
  Serial.printf("Connecting to MQTT broker %s:%u ...\n", MQTT_BROKER_HOST, MQTT_BROKER_PORT);

  const bool connected = mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
  if (connected) {
    Serial.println("MQTT connected.");
  } else {
    Serial.printf("MQTT connection failed, state=%d\n", mqttClient.state());
  }

  return connected;
}

void maintainMqtt() {
  if (!isWifiConnected()) {
    if (mqttClient.connected()) {
      mqttClient.disconnect();
    }
    return;
  }

  if (mqttClient.connected()) {
    mqttClient.loop();
    return;
  }

  ensureMqttConnected();
}

void onWifiConnected() {
  configureTimeFromWifi();
  initMqtt();
  ensureMqttConnected();
}

void maintainWifi() {
  if (isWifiConnected()) {
    return;
  }

  if (millis() - lastWifiReconnectAttempt < WIFI_RECONNECT_INTERVAL_MS) {
    return;
  }

  lastWifiReconnectAttempt = millis();
  Serial.println("Retrying WiFi connection...");
  if (connectWifi()) {
    onWifiConnected();
  }
}

bool publishSosEvent(const char *eventType, bool sosActive, double latitude, double longitude, bool includeLocation) {
  char timestamp[32];
  if (!formatIsoTimestamp(timestamp, sizeof(timestamp))) {
    Serial.printf("MQTT skipped for %s: time not available.\n", eventType);
    return false;
  }

  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["eventType"] = eventType;
  doc["timestamp"] = timestamp;
  doc["sosActive"] = sosActive;

  if (includeLocation) {
    doc["latitude"] = latitude;
    doc["longitude"] = longitude;
    doc["gpsValid"] = gps.location.isValid();
    doc["gpsAgeMs"] = gps.location.age();

    if (gps.altitude.isValid()) {
      doc["altitude"] = gps.altitude.meters();
    }

    if (gps.speed.isValid()) {
      doc["speedKmph"] = gps.speed.kmph();
    }

    if (gps.satellites.isValid()) {
      doc["satellites"] = gps.satellites.value();
    }

    if (gps.hdop.isValid()) {
      doc["hdop"] = gps.hdop.hdop();
    }
  }

  auto tryPublish = [&](const char *connectionType) -> bool {
    doc["connectionType"] = connectionType;

    char payload[MQTT_BUFFER_SIZE];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload)) {
      Serial.printf("MQTT skipped for %s: JSON payload too large.\n", eventType);
      return false;
    }

    if (strcmp(connectionType, "wifi") == 0) {
      if (!isWifiConnected() || !ensureMqttConnected()) {
        return false;
      }

      const bool published = mqttClient.publish(MQTT_TOPIC, payload, false);
      if (published) {
        Serial.printf("MQTT published (wifi) %s -> %s\n", MQTT_TOPIC, payload);
      }
      return published;
    }

    return publishSimMqtt(MQTT_TOPIC, payload);
  };

  if (callInProgress) {
    return tryPublish("wifi");
  }

  if (tryPublish(getPreferredSosChannel())) {
    return true;
  }

  const char *fallback = strcmp(getPreferredSosChannel(), "sim") == 0 ? "wifi" : "sim";
  Serial.printf("%s MQTT failed for %s, trying %s...\n", getPreferredSosChannel(), eventType, fallback);
  return tryPublish(fallback);
}

bool publishEmergencyCallEvent() {
  char timestamp[32];
  if (!formatIsoTimestamp(timestamp, sizeof(timestamp))) {
    Serial.println("MQTT skipped for emergency_call: time not available.");
    return false;
  }

  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["eventType"] = "emergency_call";
  doc["phoneNumber"] = EMERGENCY_PHONE_NUMBER;
  doc["timestamp"] = timestamp;

  if (gps.location.isValid()) {
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
  }

  auto tryPublish = [&](const char *connectionType) -> bool {
    doc["connectionType"] = connectionType;

    char payload[MQTT_BUFFER_SIZE];
    const size_t payloadLength = serializeJson(doc, payload, sizeof(payload));
    if (payloadLength == 0 || payloadLength >= sizeof(payload)) {
      Serial.println("MQTT skipped for emergency_call: JSON payload too large.");
      return false;
    }

    if (strcmp(connectionType, "wifi") == 0) {
      if (!isWifiConnected() || !ensureMqttConnected()) {
        return false;
      }

      const bool published = mqttClient.publish(MQTT_TOPIC, payload, false);
      if (published) {
        Serial.printf("MQTT published (wifi) %s -> %s\n", MQTT_TOPIC, payload);
      }
      return published;
    }

    return publishSimMqtt(MQTT_TOPIC, payload);
  };

  if (tryPublish(getPreferredSosChannel())) {
    return true;
  }

  const char *fallback = strcmp(getPreferredSosChannel(), "sim") == 0 ? "wifi" : "sim";
  Serial.printf("%s MQTT failed for emergency_call, trying %s...\n", getPreferredSosChannel(), fallback);
  return tryPublish(fallback);
}

bool ensureSimReadyForCall() {
  if (!simModuleResponsive) {
    const String atResponse = sendAtCommand("AT", 3000);
    simModuleResponsive = atResponse.indexOf("OK") >= 0;
    if (!simModuleResponsive) {
      Serial.println("Emergency call failed: SIM not responding.");
      return false;
    }
  }

  sendAtCommand("ATE0", 2000);
  const String pinResponse = sendAtCommand("AT+CPIN?", 3000);
  if (pinResponse.indexOf("READY") < 0 && pinResponse.indexOf("OK") < 0) {
    Serial.println("Emergency call failed: SIM not ready.");
    return false;
  }

  const String regResponse = sendAtCommand("AT+CREG?", 3000);
  if (regResponse.indexOf(",1") < 0 && regResponse.indexOf(",5") < 0) {
    Serial.println("Emergency call failed: SIM not registered on network.");
    return false;
  }

  return true;
}

bool placeEmergencyCall() {
  if (!ensureSimReadyForCall()) {
    return false;
  }

  char dialCommand[48];
  snprintf(dialCommand, sizeof(dialCommand), "ATD%s;", EMERGENCY_PHONE_NUMBER);

  Serial.printf("Placing emergency call to %s\n", EMERGENCY_PHONE_NUMBER);
  writeLcdLine(0, "Calling...");
  writeLcdLine(1, EMERGENCY_PHONE_NUMBER);

  const String response = sendAtCommand(dialCommand, SIM_DIAL_TIMEOUT_MS);
  const bool started = response.indexOf("OK") >= 0 || response.indexOf("CONNECT") >= 0;
  if (started) {
    callInProgress = true;
    Serial.println("Emergency call started.");
    writeLcdLine(0, "Call active");
    writeLcdLine(1, "Hold D33 3s");
  } else {
    Serial.println("Emergency call failed to start.");
    writeLcdLine(0, "Call failed");
    writeLcdLine(1, "Check SIM");
  }

  return started;
}

void hangUpEmergencyCall() {
  if (!callInProgress) {
    return;
  }

  String response = sendAtCommand("ATH", 10000);
  if (response.indexOf("OK") < 0) {
    sendAtCommand("AT+CHUP", 10000);
  }

  callInProgress = false;
  callHangupHoldStartedAt = 0;
  emergencyCallTriggered = false;
  Serial.println("Emergency call hung up.");
  writeLcdLine(0, "Call ended");
  writeLcdLine(1, "");
}

void triggerEmergencyCall(const char *reason) {
  if (callInProgress) {
    return;
  }

  Serial.println();
  Serial.printf("Emergency call triggered: %s\n", reason);

  publishEmergencyCallEvent();
  placeEmergencyCall();
}

void updateCallHangupHold(unsigned long now) {
  if (!callInProgress) {
    callHangupHoldStartedAt = 0;
    return;
  }

  const bool callPressed = digitalRead(CALL_BUTTON_PIN) == LOW;
  const bool sosPressed = digitalRead(SOS_BUTTON_PIN) == LOW;

  if (callPressed && !sosPressed) {
    if (callHangupHoldStartedAt == 0) {
      callHangupHoldStartedAt = now;
      Serial.println("Hold call button (D33) for 3 seconds to end the call...");
      writeLcdLine(0, "End call");
      writeLcdLine(1, "Hold 3 sec");
      return;
    }

    if (now - callHangupHoldStartedAt >= CALL_BUTTON_HANGUP_HOLD_MS) {
      callButtonLongPressHandled = true;
      callButtonClickCount = 0;
      hangUpEmergencyCall();
    }

    return;
  }

  if (callHangupHoldStartedAt != 0) {
    Serial.println("Call hang-up cancelled.");
    writeLcdLine(0, "Call active");
    writeLcdLine(1, "Hold D33 3s");
  }

  callHangupHoldStartedAt = 0;
}

void registerCallButtonClickDuringSos(unsigned long now) {
  if (!sosCountdownActive && !sosTrackingActive) {
    return;
  }

  if (callInProgress || isEmergencyComboActive()) {
    return;
  }

  if (callButtonClickCount == 0 || now - firstCallButtonClickAt > SOS_DOUBLE_CLICK_WINDOW_MS) {
    callButtonClickCount = 1;
    firstCallButtonClickAt = now;
    Serial.println("Call armed during SOS. Press call button again within 2 seconds.");
    writeLcdLine(0, "Call armed");
    writeLcdLine(1, "Press again");
    return;
  }

  callButtonClickCount = 0;
  triggerEmergencyCall("call button double-click during SOS");
}

void handleCallButton(unsigned long now) {
  const bool reading = digitalRead(CALL_BUTTON_PIN);

  if (reading != lastCallButtonReading) {
    lastCallButtonChangeAt = now;
    lastCallButtonReading = reading;
  }

  if (now - lastCallButtonChangeAt >= BUTTON_DEBOUNCE_MS && reading != stableCallButtonState) {
    stableCallButtonState = reading;

    if (stableCallButtonState == LOW) {
      callButtonPressedAt = now;
      callButtonLongPressHandled = false;
    } else if (callButtonPressedAt > 0) {
      const unsigned long pressDuration = now - callButtonPressedAt;

      if (
          !callButtonLongPressHandled &&
          !isEmergencyComboActive() &&
          digitalRead(SOS_BUTTON_PIN) != LOW &&
          pressDuration < CALL_BUTTON_HANGUP_HOLD_MS) {
        if (!callInProgress) {
          registerCallButtonClickDuringSos(now);
        }
      }

      callButtonPressedAt = 0;
    }
  }

  if (callButtonClickCount == 1 && now - firstCallButtonClickAt > SOS_DOUBLE_CLICK_WINDOW_MS) {
    callButtonClickCount = 0;
    if (isSosUiActive()) {
      Serial.println("Call cancelled: second press was not received in time.");
      writeLcdLine(0, "Call cancelled");
      writeLcdLine(1, isSosUiActive() ? "SOS active" : "");
    }
  }
}

void handleEmergencyCallButtons(unsigned long now) {
  const bool sosPressed = digitalRead(SOS_BUTTON_PIN) == LOW;
  const bool callPressed = digitalRead(CALL_BUTTON_PIN) == LOW;

  if (sosPressed && callPressed) {
    if (bothButtonsPressedAt == 0) {
      bothButtonsPressedAt = now;
      Serial.println("Both buttons held. Keep holding to call...");
    }

    bothButtonsGesture = true;
    emergencyComboActive = true;
    callButtonClickCount = 0;

    if (!emergencyCallTriggered && !callInProgress && now - bothButtonsPressedAt >= EMERGENCY_BUTTON_HOLD_MS) {
      emergencyCallTriggered = true;
      triggerEmergencyCall("SOS + call buttons held together");
    }
    return;
  }

  if (!sosPressed && !callPressed) {
    emergencyComboActive = false;

    if (bothButtonsGesture && !emergencyCallTriggered) {
      Serial.println("Call not started: hold both buttons a bit longer.");
      sosClickCount = 0;
    }

    bothButtonsPressedAt = 0;
    emergencyCallTriggered = false;
    bothButtonsGesture = false;
    return;
  }

  if (bothButtonsGesture) {
    emergencyComboActive = true;
  }
}

void printSosEventToSerial(const char *eventType, double latitude, double longitude) {
  Serial.println();
  Serial.printf("SOS event: %s\n", eventType);
  Serial.printf("Preferred channel: %s\n", getPreferredSosChannel());

  if (strcmp(eventType, "sos_location") == 0) {
    Serial.printf("Device: %s\n", DEVICE_ID);
    Serial.printf("SOS location: %.6f, %.6f\n", latitude, longitude);
    Serial.printf("Google Maps: https://maps.google.com/?q=%.6f,%.6f\n", latitude, longitude);

    if (gps.altitude.isValid()) {
      Serial.printf("Altitude: %.2f m\n", gps.altitude.meters());
    }

    if (gps.speed.isValid()) {
      Serial.printf("Speed: %.2f km/h\n", gps.speed.kmph());
    }

    if (gps.satellites.isValid()) {
      Serial.printf("Satellites: %u\n", gps.satellites.value());
    }
  }
}

bool sendSosEvent(const char *eventType, bool sosActive, double latitude, double longitude, bool includeLocation) {
  printSosEventToSerial(eventType, latitude, longitude);
  return publishSosEvent(eventType, sosActive, latitude, longitude, includeLocation);
}

void printSimStatus() {
  if (isSimAtBusy() || callInProgress) {
    return;
  }

  if (millis() - lastSimStatusAt < SIM_STATUS_INTERVAL_MS) {
    return;
  }

  lastSimStatusAt = millis();

  if (!simModuleResponsive) {
    const String atResponse = sendAtCommand("AT", 500);
    simModuleResponsive = atResponse.indexOf("OK") >= 0;
    if (!simModuleResponsive) {
      return;
    }
  }

  Serial.println();
  Serial.println("--- SIM module status ---");
  sendAtCommand("AT+CPIN?", 1000);
  sendAtCommand("AT+CSQ", 1000);
  sendAtCommand("AT+CREG?", 1000);
  sendAtCommand("AT+CGACT?", 1000);
  sendAtCommand("AT+CGPADDR=1", 1000);
}

void startSosBuzzer() {
  sosBuzzerActive = true;
  tone(BUZZER_PIN, BUZZER_FREQUENCY_HZ);

  Serial.println("SOS buzzer started. Short-press SOS button once to silence it.");
  writeLcdLine(0, "SOS buzzer ON");
  writeLcdLine(1, "Press to stop");
}

void stopSosBuzzer() {
  sosBuzzerActive = false;
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("SOS buzzer stopped.");
  writeLcdLine(0, "Buzzer stopped");
  writeLcdLine(1, "Tracking live");
}

void sendLatestSosGpsLocation() {
  if (!gps.location.isValid() || gps.location.age() > MAX_GPS_AGE_MS) {
    Serial.println("SOS tracking update skipped: GPS fix is not ready or is too old.");
    writeLcdLine(0, "SOS tracking");
    writeLcdLine(1, "Waiting GPS");
    return;
  }

  const double latitude = gps.location.lat();
  const double longitude = gps.location.lng();
  const bool published = sendSosEvent("sos_location", true, latitude, longitude, true);

  writeLcdLine(0, "SOS live sent");
  writeLcdLine(1, published ? "MQTT OK" : "MQTT failed");
}

void stopSosTracking() {
  sosTrackingActive = false;
  sosCountdownActive = false;
  sosClickCount = 0;

  if (sosBuzzerActive) {
    stopSosBuzzer();
  }

  sendSosEvent("sos_stopped", false, 0.0, 0.0, false);

  Serial.println("SOS live tracking stopped by long press.");
  writeLcdLine(0, "SOS stopped");
  writeLcdLine(1, "Hold complete");
}

void startSosTracking(unsigned long now) {
  sosCountdownActive = false;
  sosTrackingActive = true;
  sosClickCount = 0;
  lastSosLocationSentAt = now;

  Serial.println();
  Serial.println("SOS mode started. Live GPS will publish every 8 seconds.");
  sendSosEvent("sos_started", true, 0.0, 0.0, false);
  startSosBuzzer();
  sendLatestSosGpsLocation();
}

void startSosCountdown(unsigned long now) {
  sosCountdownActive = true;
  sosCountdownStartedAt = now;
  lastSosLcdAt = 0;
  sosClickCount = 0;

  Serial.println("SOS confirmed. GPS will send after 12 seconds.");
  prepareSimForSos();
  writeLcdLine(0, "SOS confirmed");
  writeLcdLine(1, "Wait 12 sec");
}

void registerSosButtonClick(unsigned long now) {
  if (isEmergencyComboActive() || digitalRead(CALL_BUTTON_PIN) == LOW) {
    return;
  }

  if (sosTrackingActive) {
    if (sosBuzzerActive) {
      stopSosBuzzer();
    } else {
      Serial.println("SOS live tracking is still active. Hold SOS button for 5 seconds to stop tracking.");
      writeLcdLine(0, "Tracking live");
      writeLcdLine(1, "Hold to stop");
    }
    return;
  }

  if (sosCountdownActive) {
    Serial.println("SOS countdown already running.");
    return;
  }

  if (sosClickCount == 0 || now - firstSosClickAt > SOS_DOUBLE_CLICK_WINDOW_MS) {
    sosClickCount = 1;
    firstSosClickAt = now;
    Serial.println("SOS armed. Press button again within 2 seconds.");
    writeLcdLine(0, "SOS armed");
    writeLcdLine(1, "Press again");
    return;
  }

  startSosCountdown(now);
}

void updateSosCountdown(unsigned long now) {
  if (!sosCountdownActive) {
    return;
  }

  const unsigned long elapsed = now - sosCountdownStartedAt;
  if (elapsed >= SOS_SEND_DELAY_MS) {
    startSosTracking(now);
    return;
  }

  if (now - lastSosLcdAt >= 1000) {
    const unsigned long remainingSeconds = (SOS_SEND_DELAY_MS - elapsed + 999) / 1000;
    char countdownLine[LCD_COLUMNS + 1];
    snprintf(countdownLine, sizeof(countdownLine), "Sending in %lus", remainingSeconds);
    writeLcdLine(0, "SOS countdown");
    writeLcdLine(1, countdownLine);
    lastSosLcdAt = now;
  }
}

void updateSosTracking(unsigned long now) {
  if (!sosTrackingActive) {
    return;
  }

  if (now - lastSosLocationSentAt >= SOS_LOCATION_SEND_INTERVAL_MS) {
    lastSosLocationSentAt = now;
    sendLatestSosGpsLocation();
  }
}

void handleSosButton() {
  const unsigned long now = millis();
  const bool reading = digitalRead(SOS_BUTTON_PIN);

  if (reading != lastButtonReading) {
    lastButtonChangeAt = now;
    lastButtonReading = reading;
  }

  if (now - lastButtonChangeAt >= BUTTON_DEBOUNCE_MS && reading != stableButtonState) {
    stableButtonState = reading;

    if (stableButtonState == LOW) {
      buttonPressedAt = now;
      longPressHandled = false;
      motionOnButtonPress(now, &lcd);
    } else if (buttonPressedAt > 0) {
      if (!longPressHandled && !isEmergencyComboActive() && digitalRead(CALL_BUTTON_PIN) != LOW) {
        registerSosButtonClick(now);
      }
      buttonPressedAt = 0;
    }
  }

  if (
      stableButtonState == LOW &&
      sosTrackingActive &&
      !longPressHandled &&
      buttonPressedAt > 0 &&
      now - buttonPressedAt >= SOS_STOP_LONG_PRESS_MS) {
    longPressHandled = true;
    stopSosTracking();
  }

  if (sosClickCount == 1 && now - firstSosClickAt > SOS_DOUBLE_CLICK_WINDOW_MS) {
    sosClickCount = 0;
    Serial.println("SOS cancelled: second click was not received in time.");
    writeLcdLine(0, "SOS cancelled");
    writeLcdLine(1, "Try again");
  }

  updateSosCountdown(now);
  updateSosTracking(now);
}

void printGpsStatus() {
  Serial.printf("GPS chars read: %lu\n", gps.charsProcessed());
  Serial.printf("GPS sentences passed: %lu\n", gps.passedChecksum());
  Serial.printf("GPS sentences failed: %lu\n", gps.failedChecksum());

  if (gps.satellites.isValid()) {
    Serial.printf("GPS satellites: %u\n", gps.satellites.value());
  } else {
    Serial.println("GPS satellites: unknown");
  }

  if (gps.hdop.isValid()) {
    Serial.printf("GPS HDOP: %.2f\n", gps.hdop.hdop());
  } else {
    Serial.println("GPS HDOP: unknown");
  }

  if (gps.location.isValid()) {
    Serial.printf("Latitude: %.6f\n", gps.location.lat());
    Serial.printf("Longitude: %.6f\n", gps.location.lng());
    Serial.printf("Altitude: %.2f m\n", gps.altitude.meters());
    Serial.printf("Speed: %.2f km/h\n", gps.speed.kmph());
  } else {
    Serial.println("Location: no GPS fix yet");
  }

  const bool gpsDateLooksReal =
      gps.date.isValid() &&
      gps.time.isValid() &&
      gps.date.year() >= 2020 &&
      gps.date.month() >= 1 &&
      gps.date.day() >= 1;

  if (gpsDateLooksReal) {
    Serial.printf(
        "GPS UTC date/time: %04d-%02d-%02d %02d:%02d:%02d\n",
        gps.date.year(),
        gps.date.month(),
        gps.date.day(),
        gps.time.hour(),
        gps.time.minute(),
        gps.time.second());
  } else {
    Serial.println("GPS UTC date/time: not available yet");
  }
}

void printStatus() {
  if (wifiOperationInProgress || millis() - lastStatusAt < STATUS_INTERVAL_MS) {
    return;
  }

  lastStatusAt = millis();

  Serial.println();
  Serial.printf("Device: %s\n", DEVICE_ID);
  Serial.printf("Uptime: %lu ms\n", millis());
  Serial.printf("WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "connected" : "disconnected");
  Serial.printf("MQTT: %s\n", mqttClient.connected() ? "connected" : "disconnected");
  Serial.printf("SIM MQTT: %s\n", isSimMqttConnected() ? "connected" : "disconnected");

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  }

  struct tm timeInfo;
  const bool hasLocalTime = timeConfigured && getLocalTime(&timeInfo, 1000);
  if (hasLocalTime) {
    char formattedTime[40];
    strftime(formattedTime, sizeof(formattedTime), "%Y-%m-%d %H:%M:%S", &timeInfo);
    Serial.printf("Date/time: %s\n", formattedTime);
  } else {
    Serial.println("Date/time: not synced yet");
  }

  printGpsStatus();
  if (isMpuReady()) {
    Serial.printf(
        "Steps: %lu | Activity: %s (%c)\n",
        static_cast<unsigned long>(getStepCount()),
        getActivityName(),
        getActivityLabel());
  } else {
    Serial.println("MPU-6050: not ready");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  while (Serial.available() > 0) {
    Serial.read();
  }

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(CALL_BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  lcd.init();
  lcd.backlight();
  writeLcdLine(0, "SurakshaWatch");
  writeLcdLine(1, "Starting...");

  Serial.println();
  Serial.println("SurakshaWatch ESP32 bring-up test");
  Serial.println("----------------------------------");
  Serial.printf(
      "SOS button GPIO%d, call button GPIO%d. Hold BOTH ~0.2s to dial %s.\n",
      SOS_BUTTON_PIN,
      CALL_BUTTON_PIN,
      EMERGENCY_PHONE_NUMBER);
  Serial.printf("During SOS: double-click call button to dial; hold call 3s to hang up.\n");
  Serial.printf("SOS: double-click starts tracking, hold 5s stops tracking.\n");
  Serial.printf("SOS buzzer on GPIO%d.\n", BUZZER_PIN);
  Serial.printf("Starting GPS on RX2 GPIO%d, TX2 GPIO%d at %lu baud\n", GPS_RX_PIN, GPS_TX_PIN, GPS_BAUD);
  GpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  initSimModule();

  if (initMotion()) {
    Serial.println("MPU-6050 initialized.");
    writeLcdLine(0, "MPU OK");
    writeLcdLine(1, "Motion ready");
  } else {
    Serial.println("MPU-6050 init failed. Check wiring on D21/D22.");
    writeLcdLine(0, "MPU FAIL");
    writeLcdLine(1, "Check wiring");
  }
  delay(1000);

  if (connectWifi()) {
    onWifiConnected();
  }
}

void loop() {
  const unsigned long now = millis();

  updateCallHangupHold(now);
  handleEmergencyCallButtons(now);
  handleCallButton(now);
  handleSosButton();

  blinkLed();
  readGps();
  readSimSpontaneousMessages();
  maintainWifi();
  maintainMqtt();
  if (!callInProgress) {
    maintainSimMqtt();
  }

  const MotionContext motionCtx = {isSosUiActive(), timeConfigured, &gps, &lcd};
  motionTick(now, motionCtx);

  printSimStatus();
  printStatus();
}
