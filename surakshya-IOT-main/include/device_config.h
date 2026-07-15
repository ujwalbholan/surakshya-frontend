#pragma once

static constexpr char DEVICE_ID[] = "wearable-001";

// ESP32 only supports 2.4 GHz WiFi. SSID must match exactly (spaces matter).
// Scan also shows: HimalayanJavaExpress_2
static constexpr char WIFI_SSID[] = "Apexing Network";
static constexpr char WIFI_PASSWORD[] = "W3lcom3@ApexING";
static constexpr unsigned long WIFI_CONNECT_TIMEOUT_MS = 30000;
static constexpr unsigned long WIFI_RECONNECT_INTERVAL_MS = 15000;
static constexpr unsigned long WIFI_SCAN_LOG_INTERVAL_MS = 60000;

static constexpr char SIM_APN[] = "ncell";

// Public MQTT broker — reachable from WiFi and Ncell cellular data.
// Replace with your production broker hostname when deploying.
static constexpr char MQTT_BROKER_HOST[] = "test.mosquitto.org";
static constexpr uint16_t MQTT_BROKER_PORT = 1883;
static constexpr char MQTT_CLIENT_ID[] = "surakshyawatch-wearable-001";
// Must differ from MQTT_CLIENT_ID — same broker rejects duplicate client IDs.
static constexpr char SIM_MQTT_CLIENT_ID[] = "surakshyawatch-wearable-001-sim";
static constexpr char MQTT_USERNAME[] = "";
static constexpr char MQTT_PASSWORD[] = "";
static constexpr char MQTT_TOPIC[] = "surakshyawatch/wearable-001/events";
// Retained backend → device commands (emergency contact phone, etc.).
static constexpr char MQTT_COMMANDS_TOPIC[] = "surakshyawatch/wearable-001/commands";
static constexpr size_t MQTT_BUFFER_SIZE = 512;
static constexpr unsigned long MQTT_RECONNECT_INTERVAL_MS = 5000;

static constexpr int LED_PIN = 2;

// SOS push button

static constexpr int SOS_BUTTON_PIN = 23;

// Emergency call button (GPIO33 / D33).
// Hold SOS + call together to dial anytime; during SOS double-click call to dial;
// hold call for 3s to hang up.
static constexpr int CALL_BUTTON_PIN = 33;
static constexpr char EMERGENCY_PHONE_NUMBER[] = "+9779828755846";
// NVS key (namespace: STEP_PREFS_NAMESPACE) for app-synced dial number.
static constexpr char EMERGENCY_PHONE_PREFS_KEY[] = "emPhone";
static constexpr unsigned long EMERGENCY_BUTTON_HOLD_MS = 200;
static constexpr unsigned long CALL_BUTTON_HANGUP_HOLD_MS = 3000;
static constexpr unsigned long SIM_DIAL_TIMEOUT_MS = 30000;
static constexpr unsigned long SIM_DATA_ACTIVATE_TIMEOUT_MS = 30000;
static constexpr unsigned long SIM_MQTT_START_TIMEOUT_MS = 60000;
static constexpr unsigned long SIM_MQTT_CONNECT_TIMEOUT_MS = 30000;
static constexpr int SIM_MQTT_CLIENT_INDEX = 0;

// Piezo buzzer 
// Buzzer + -> GPIO25 / D25, buzzer - -> GND.
static constexpr int BUZZER_PIN = 25;
static constexpr unsigned int BUZZER_FREQUENCY_HZ = 200;

// 16x2 I2C LCD 
static constexpr uint8_t LCD_I2C_ADDRESS = 0x27;
static constexpr int LCD_COLUMNS = 16;
static constexpr int LCD_ROWS = 2;
static constexpr int LCD_SDA_PIN = 21;
static constexpr int LCD_SCL_PIN = 22;

// NEO-M8N GPS UART 
// GPS TX -> ESP32 RX2 GPIO16
// GPS RX -> ESP32 TX2 GPIO17
static constexpr int GPS_RX_PIN = 16;
static constexpr int GPS_TX_PIN = 17;
static constexpr unsigned long GPS_BAUD = 9600;

// A7670C SIM UART wiring.
// SIM TXD -> ESP32 D26 / GPIO26 (ESP32 receives)
// SIM RXD -> ESP32 D27 / GPIO27 (ESP32 transmits)
// ESP32 GND <-> SIM GND <-> battery negative
static constexpr int SIM_RX_PIN = 26;
static constexpr int SIM_TX_PIN = 27;
static constexpr int SIM_RST_PIN = -1;
static constexpr unsigned long SIM_BAUD = 115200;
static constexpr unsigned long SIM_STATUS_INTERVAL_MS = 30000;
static constexpr unsigned long SIM_AT_TIMEOUT_MS = 800;

// Nepal time is UTC + 5:45.
static constexpr long GMT_OFFSET_SECONDS = 20700;
static constexpr int DAYLIGHT_OFFSET_SECONDS = 0;

static constexpr unsigned long BLINK_INTERVAL_MS = 500;
static constexpr unsigned long STATUS_INTERVAL_MS = 5000;
static constexpr unsigned long BUTTON_DEBOUNCE_MS = 50;
static constexpr unsigned long SOS_DOUBLE_CLICK_WINDOW_MS = 2000;
static constexpr unsigned long SOS_SEND_DELAY_MS = 12000;
static constexpr unsigned long SOS_LOCATION_SEND_INTERVAL_MS = 8000;
static constexpr unsigned long SOS_STOP_LONG_PRESS_MS = 5000;
static constexpr unsigned long MAX_GPS_AGE_MS = 10000;

// MPU-6050 on shared I2C bus (GPIO21 SDA, GPIO22 SCL).
// AD0 -> GND = 0x68 (default). AD0 -> 3V3 = 0x69.
static constexpr uint8_t MPU6050_I2C_ADDRESS = 0x68;
static constexpr uint8_t MPU6050_I2C_ADDRESS_ALT = 0x69;
static constexpr uint32_t MPU_I2C_CLOCK_HZ = 100000;
static constexpr unsigned long MPU_READ_INTERVAL_MS = 20;
static constexpr unsigned long MOTION_DISPLAY_INTERVAL_MS = 500;
static constexpr size_t MOTION_MAG_BUFFER_SIZE = 50;

// Step counter
static constexpr float STEP_UPPER_THRESHOLD = 1.25f;
static constexpr float STEP_LOWER_THRESHOLD = 0.85f;
static constexpr unsigned long STEP_MIN_INTERVAL_MS = 300;
static constexpr unsigned long STEP_MAX_INTERVAL_MS = 2000;
static constexpr uint32_t STEP_EEPROM_SAVE_EVERY = 100;
static constexpr char STEP_PREFS_NAMESPACE[] = "surakshya";
static constexpr char STEP_PREFS_KEY[] = "steps";
static constexpr char STEP_PREFS_DAY_KEY[] = "stepDay";

// Raise-to-wake display
static constexpr float RAISE_AZ_MIN = 0.65f;
static constexpr float RAISE_AZ_MAX = 1.00f;
static constexpr float RAISE_AX_MAX = 0.40f;
static constexpr float RAISE_AZ_LOW = 0.35f;
static constexpr float RAISE_AZ_REJECT = 1.10f;
static constexpr float RAISE_DELTA_Z = 0.30f;
static constexpr unsigned long RAISE_TIME_MS = 200;
static constexpr unsigned long RAISE_SAMPLE_INTERVAL_MS = 50;
static constexpr unsigned long DISPLAY_ON_TIME_MS = 6000;
static constexpr unsigned long DISPLAY_OFF_WAIT_MS = 3000;

// Activity recognition (variance of magnitude over 1s window)
static constexpr float VARIANCE_STILL = 0.005f;
static constexpr float VARIANCE_FIDGET = 0.020f;
static constexpr float VARIANCE_WALK = 0.120f;
static constexpr float VARIANCE_RUN = 0.400f;
static constexpr float GYRO_STILL_MAX = 5.0f;
static constexpr unsigned long ACTIVITY_UPDATE_INTERVAL_MS = 1000;

// Inactivity reminder
static constexpr float INACTIVITY_VARIANCE_THRESHOLD = 0.035f;
static constexpr unsigned long INACTIVITY_LIMIT_MS = 1800000;
static constexpr unsigned long REMINDER_BUZZ_MS = 500;
static constexpr unsigned long REMINDER_INTERVAL_MS = 300000;
static constexpr unsigned long REMINDER_DISPLAY_MS = 3000;
static constexpr unsigned long INACTIVITY_CHECK_INTERVAL_MS = 1000;
static constexpr int QUIET_HOUR_START = 22;
static constexpr int QUIET_HOUR_END = 6;
