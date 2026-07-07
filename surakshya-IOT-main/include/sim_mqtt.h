#pragma once

#include <Arduino.h>

bool isSimAtBusy();
void beginSimAtUse();
void endSimAtUse();

bool publishSimMqtt(const char *topic, const char *payload);
void disconnectSimMqtt();
bool isSimMqttConnected();
void notifySimMqttConnectionLost();
void maintainSimMqtt();
void prepareSimForSos();
