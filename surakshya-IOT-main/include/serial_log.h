#pragma once

#include <Arduino.h>

#include "device_config.h"

inline bool serialLogNormal() {
  return SERIAL_LOG_LEVEL >= 1;
}

inline bool serialLogVerbose() {
  return SERIAL_LOG_LEVEL >= 2;
}

// Always shown: SOS, calls, Wi‑Fi/MQTT connect results.
#define LOG_EVENT(...) \
  do {                 \
    Serial.printf(__VA_ARGS__); \
  } while (0)

#define LOG_EVENT_LN(msg) \
  do {                    \
    Serial.println(msg);  \
  } while (0)

#define LOG_NORMAL(...)               \
  do {                                \
    if (serialLogNormal()) {          \
      Serial.printf(__VA_ARGS__);     \
    }                                 \
  } while (0)

#define LOG_NORMAL_LN(msg)   \
  do {                       \
    if (serialLogNormal()) { \
      Serial.println(msg);   \
    }                        \
  } while (0)

#define LOG_VERBOSE(...)              \
  do {                                \
    if (serialLogVerbose()) {         \
      Serial.printf(__VA_ARGS__);     \
    }                                 \
  } while (0)

#define LOG_VERBOSE_LN(msg)   \
  do {                        \
    if (serialLogVerbose()) { \
      Serial.println(msg);    \
    }                         \
  } while (0)
