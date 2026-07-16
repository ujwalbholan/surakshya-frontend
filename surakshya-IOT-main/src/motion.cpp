#include <LiquidCrystal_I2C.h>
#include <Preferences.h>
#include <TinyGPSPlus.h>
#include <Wire.h>
#include <math.h>
#include <time.h>

#include "device_config.h"
#include "motion.h"
#include "serial_log.h"

namespace {

enum class StepState { WaitForPeak, WaitForValley };

enum class ActivityLevel { Still, LightMove, Walking, Running, VeryActive };

// Direct Wire driver — Adafruit begin() rejects many GY-521 clones whose
// WHO_AM_I is not exactly 0x68 (e.g. MPU6500 = 0x70).
static constexpr uint8_t MPU_REG_SMPLRT_DIV = 0x19;
static constexpr uint8_t MPU_REG_CONFIG = 0x1A;
static constexpr uint8_t MPU_REG_GYRO_CONFIG = 0x1B;
static constexpr uint8_t MPU_REG_ACCEL_CONFIG = 0x1C;
static constexpr uint8_t MPU_REG_ACCEL_XOUT_H = 0x3B;
static constexpr uint8_t MPU_REG_PWR_MGMT_1 = 0x6B;
static constexpr uint8_t MPU_REG_WHO_AM_I = 0x75;
static constexpr float MPU_ACCEL_LSB_PER_G = 16384.0f;  // ±2g
static constexpr float MPU_GYRO_LSB_PER_DPS = 131.0f;   // ±250°/s

Preferences stepPrefs;
bool mpuReady = false;
uint8_t mpuAddress = MPU6050_I2C_ADDRESS;
uint8_t mpuWhoAmI = 0;

float ax = 0.0f;
float ay = 0.0f;
float az = 0.0f;
float gx = 0.0f;
float gy = 0.0f;
float gz = 0.0f;
float mag = 1.0f;
float gyroMag = 0.0f;
float magVariance = 0.0f;

float magBuffer[MOTION_MAG_BUFFER_SIZE];
uint8_t magBufferIndex = 0;
uint8_t magBufferCount = 0;

uint32_t stepCount = 0;
StepState stepState = StepState::WaitForPeak;
unsigned long lastPeakAt = 0;

ActivityLevel activityLevel = ActivityLevel::Still;
char activityLabel = 'S';

bool displayAwake = true;
unsigned long displayWakeUntil = 0;
unsigned long displaySleepAllowedAt = 0;
unsigned long lastRaiseSampleAt = 0;
float lastRaiseAz = 1.0f;
float raiseWindowStartAz = 1.0f;
unsigned long raiseWindowStartAt = 0;
bool raiseWindowActive = false;

unsigned long lastMpuReadAt = 0;
unsigned long lastActivityUpdateAt = 0;
unsigned long lastInactivityCheckAt = 0;
unsigned long lastDisplayUpdateAt = 0;
unsigned long lastActiveAt = 0;
unsigned long lastReminderAt = 0;
unsigned long reminderDisplayUntil = 0;
bool reminderActive = false;
unsigned long reminderBuzzUntil = 0;
bool reminderBuzzing = false;
unsigned long lastMpuRetryAt = 0;
bool stepPrefsOpened = false;

int lastStepDay = -1;

void writeLcdLine(LiquidCrystal_I2C *lcd, uint8_t row, const char *message) {
  if (lcd == nullptr) {
    return;
  }

  char padded[LCD_COLUMNS + 1];
  snprintf(padded, sizeof(padded), "%-16.16s", message);
  lcd->setCursor(0, row);
  lcd->print(padded);
}

void pushMagSample(float sample) {
  magBuffer[magBufferIndex] = sample;
  magBufferIndex = (magBufferIndex + 1) % MOTION_MAG_BUFFER_SIZE;
  if (magBufferCount < MOTION_MAG_BUFFER_SIZE) {
    magBufferCount++;
  }
}

bool computeMagVariance(float &varianceOut) {
  if (magBufferCount < MOTION_MAG_BUFFER_SIZE) {
    return false;
  }

  float sum = 0.0f;
  for (uint8_t i = 0; i < MOTION_MAG_BUFFER_SIZE; i++) {
    sum += magBuffer[i];
  }

  const float mean = sum / MOTION_MAG_BUFFER_SIZE;
  float variance = 0.0f;
  for (uint8_t i = 0; i < MOTION_MAG_BUFFER_SIZE; i++) {
    const float delta = magBuffer[i] - mean;
    variance += delta * delta;
  }

  varianceOut = variance / MOTION_MAG_BUFFER_SIZE;
  return true;
}

uint8_t countPeaksPerSecond() {
  if (magBufferCount < MOTION_MAG_BUFFER_SIZE) {
    return 0;
  }

  float sum = 0.0f;
  for (uint8_t i = 0; i < MOTION_MAG_BUFFER_SIZE; i++) {
    sum += magBuffer[i];
  }
  const float mean = sum / MOTION_MAG_BUFFER_SIZE;

  uint8_t peaks = 0;
  bool above = magBuffer[0] > mean;
  for (uint8_t i = 1; i < MOTION_MAG_BUFFER_SIZE; i++) {
    const bool nowAbove = magBuffer[i] > mean;
    if (!above && nowAbove) {
      peaks++;
    }
    above = nowAbove;
  }

  return peaks / 2;
}

void saveStepCount() {
  stepPrefs.putUInt(STEP_PREFS_KEY, stepCount);
  stepPrefs.putInt(STEP_PREFS_DAY_KEY, lastStepDay);
}

void loadStepCount() {
  stepCount = stepPrefs.getUInt(STEP_PREFS_KEY, 0);
  lastStepDay = stepPrefs.getInt(STEP_PREFS_DAY_KEY, -1);
}

void updateActivityLabel() {
  switch (activityLevel) {
    case ActivityLevel::Still:
      activityLabel = 'S';
      break;
    case ActivityLevel::LightMove:
      activityLabel = 'L';
      break;
    case ActivityLevel::Walking:
      activityLabel = 'W';
      break;
    case ActivityLevel::Running:
      activityLabel = 'R';
      break;
    case ActivityLevel::VeryActive:
      activityLabel = 'V';
      break;
  }
}

bool isQuietHours(bool timeConfigured) {
  if (!timeConfigured) {
    return false;
  }

  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 100)) {
    return false;
  }

  return timeInfo.tm_hour >= QUIET_HOUR_START || timeInfo.tm_hour < QUIET_HOUR_END;
}

void resetStepsAtMidnight(bool timeConfigured) {
  if (!timeConfigured) {
    return;
  }

  struct tm timeInfo;
  if (!getLocalTime(&timeInfo, 100)) {
    return;
  }

  const int today = timeInfo.tm_yday;
  if (lastStepDay < 0) {
    lastStepDay = today;
    return;
  }

  if (today != lastStepDay) {
    stepCount = 0;
    lastStepDay = today;
    saveStepCount();
  }
}

bool mpuWriteReg(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(reg);
  Wire.write(value);
  return Wire.endTransmission() == 0;
}

bool mpuReadBytes(uint8_t reg, uint8_t *buffer, size_t length) {
  Wire.beginTransmission(mpuAddress);
  Wire.write(reg);
  // Prefer repeated-start; fall back to stop+start (more reliable on some ESP32 cores).
  if (Wire.endTransmission(false) != 0) {
    Wire.beginTransmission(mpuAddress);
    Wire.write(reg);
    if (Wire.endTransmission(true) != 0) {
      return false;
    }
  }

  const size_t got = Wire.requestFrom(
      static_cast<uint16_t>(mpuAddress),
      static_cast<size_t>(length));
  if (got != length) {
    return false;
  }

  for (size_t i = 0; i < length; i++) {
    buffer[i] = static_cast<uint8_t>(Wire.read());
  }
  return true;
}

bool mpuReadReg(uint8_t reg, uint8_t &value) {
  return mpuReadBytes(reg, &value, 1);
}

bool isAcceptedMpuWhoAmI(uint8_t who) {
  // Genuine MPU6050 = 0x68. Common modules: MPU6500/9250 clones differ.
  switch (who) {
    case 0x68:
    case 0x70:
    case 0x71:
    case 0x72:
    case 0x73:
    case 0x98:
      return true;
    default:
      // Still usable if the device ACKed and WHO_AM_I is non-zero/non-0xFF.
      return who != 0x00 && who != 0xFF;
  }
}

bool isLikelyLcdAddress(uint8_t address) {
  return address == LCD_I2C_ADDRESS || address == 0x3F;
}

void prepareI2cBus() {
  // Soft re-init only — avoid GPIO bit-bang recovery on a live LCD+MPU bus.
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  Wire.setClock(MPU_I2C_CLOCK_HZ);
#if defined(WIRE_HAS_TIMEOUT)
  Wire.setTimeOut(100);
#endif
  delay(50);
}

uint8_t scanI2cBus(uint8_t *foundAddresses, uint8_t maxFound, bool verbose) {
  if (verbose) {
    Serial.printf("I2C scan (SDA=%d, SCL=%d):\n", LCD_SDA_PIN, LCD_SCL_PIN);
  }
  uint8_t found = 0;
  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() != 0) {
      continue;
    }
    if (verbose) {
      Serial.printf("  - 0x%02X\n", address);
    }
    if (foundAddresses != nullptr && found < maxFound) {
      foundAddresses[found] = address;
    }
    found++;
  }
  if (verbose && found == 0) {
    Serial.println("  (no devices)");
  }
  return found;
}

bool probeAndConfigureMpu(uint8_t address) {
  mpuAddress = address;

  Wire.beginTransmission(address);
  if (Wire.endTransmission() != 0) {
    return false;
  }

  uint8_t who = 0;
  if (!mpuReadReg(MPU_REG_WHO_AM_I, who)) {
    Serial.printf("MPU @0x%02X: failed to read WHO_AM_I\n", address);
    return false;
  }

  Serial.printf("MPU @0x%02X: WHO_AM_I=0x%02X\n", address, who);
  if (!isAcceptedMpuWhoAmI(who)) {
    Serial.printf("MPU @0x%02X: unsupported WHO_AM_I\n", address);
    return false;
  }

  // Device reset then wake (clear sleep bit). Some modules need a short settle.
  if (!mpuWriteReg(MPU_REG_PWR_MGMT_1, 0x80)) {
    Serial.printf("MPU @0x%02X: reset write failed\n", address);
    return false;
  }
  delay(100);
  if (!mpuWriteReg(MPU_REG_PWR_MGMT_1, 0x00)) {
    Serial.printf("MPU @0x%02X: wake write failed\n", address);
    return false;
  }
  delay(50);

  // Match previous Adafruit config: ±2g, ±250 dps, DLPF ~21 Hz (CONFIG=0x04).
  if (!mpuWriteReg(MPU_REG_SMPLRT_DIV, 0x00) ||
      !mpuWriteReg(MPU_REG_CONFIG, 0x04) ||
      !mpuWriteReg(MPU_REG_GYRO_CONFIG, 0x00) ||
      !mpuWriteReg(MPU_REG_ACCEL_CONFIG, 0x00)) {
    Serial.printf("MPU @0x%02X: config write failed\n", address);
    return false;
  }

  uint8_t sample[6];
  if (!mpuReadBytes(MPU_REG_ACCEL_XOUT_H, sample, sizeof(sample))) {
    Serial.printf("MPU @0x%02X: accel read failed after config\n", address);
    return false;
  }

  mpuWhoAmI = who;
  return true;
}

bool tryConfigureAnyMpu(bool verbose) {
  uint8_t foundAddresses[16];
  uint8_t found = 0;

  if (verbose) {
    found = scanI2cBus(foundAddresses, sizeof(foundAddresses), true);
  }

  const uint8_t preferred[] = {MPU6050_I2C_ADDRESS, MPU6050_I2C_ADDRESS_ALT};
  for (uint8_t address : preferred) {
    if (probeAndConfigureMpu(address)) {
      return true;
    }
  }

  // Boot only: try other non-LCD addresses from the scan.
  for (uint8_t i = 0; i < found && i < sizeof(foundAddresses); i++) {
    const uint8_t address = foundAddresses[i];
    if (isLikelyLcdAddress(address) ||
        address == MPU6050_I2C_ADDRESS ||
        address == MPU6050_I2C_ADDRESS_ALT) {
      continue;
    }
    if (verbose) {
      Serial.printf("Trying I2C device 0x%02X as IMU...\n", address);
    }
    if (probeAndConfigureMpu(address)) {
      return true;
    }
  }

  return false;
}

void readMpu(unsigned long now) {
  if (!mpuReady || now - lastMpuReadAt < MPU_READ_INTERVAL_MS) {
    return;
  }

  lastMpuReadAt = now;

  uint8_t raw[14];
  if (!mpuReadBytes(MPU_REG_ACCEL_XOUT_H, raw, sizeof(raw))) {
    return;
  }

  const int16_t rawAx = static_cast<int16_t>((raw[0] << 8) | raw[1]);
  const int16_t rawAy = static_cast<int16_t>((raw[2] << 8) | raw[3]);
  const int16_t rawAz = static_cast<int16_t>((raw[4] << 8) | raw[5]);
  // raw[6], raw[7] = temperature
  const int16_t rawGx = static_cast<int16_t>((raw[8] << 8) | raw[9]);
  const int16_t rawGy = static_cast<int16_t>((raw[10] << 8) | raw[11]);
  const int16_t rawGz = static_cast<int16_t>((raw[12] << 8) | raw[13]);

  ax = rawAx / MPU_ACCEL_LSB_PER_G;
  ay = rawAy / MPU_ACCEL_LSB_PER_G;
  az = rawAz / MPU_ACCEL_LSB_PER_G;
  gx = rawGx / MPU_GYRO_LSB_PER_DPS;
  gy = rawGy / MPU_GYRO_LSB_PER_DPS;
  gz = rawGz / MPU_GYRO_LSB_PER_DPS;

  mag = sqrtf(ax * ax + ay * ay + az * az);
  gyroMag = sqrtf(gx * gx + gy * gy + gz * gz);
  pushMagSample(mag);
}

void updateSteps(unsigned long now, bool timeConfigured) {
  if (!mpuReady) {
    return;
  }

  resetStepsAtMidnight(timeConfigured);

  switch (stepState) {
    case StepState::WaitForPeak:
      if (mag > STEP_UPPER_THRESHOLD) {
        lastPeakAt = now;
        stepState = StepState::WaitForValley;
      }
      break;

    case StepState::WaitForValley:
      if (mag < STEP_LOWER_THRESHOLD) {
        const unsigned long interval = now - lastPeakAt;
        if (interval >= STEP_MIN_INTERVAL_MS && interval <= STEP_MAX_INTERVAL_MS) {
          stepCount++;
          if (stepCount % STEP_EEPROM_SAVE_EVERY == 0) {
            saveStepCount();
          }
        }
        stepState = StepState::WaitForPeak;
      } else if (now - lastPeakAt > STEP_MAX_INTERVAL_MS) {
        stepState = StepState::WaitForPeak;
      }
      break;
  }
}

void wakeDisplay(unsigned long now, LiquidCrystal_I2C *lcd) {
  displayAwake = true;
  displayWakeUntil = now + DISPLAY_ON_TIME_MS;
  displaySleepAllowedAt = now + DISPLAY_OFF_WAIT_MS;

  if (lcd != nullptr) {
    lcd->backlight();
  }
}

void sleepDisplay(LiquidCrystal_I2C *lcd) {
  displayAwake = false;
  if (lcd != nullptr) {
    lcd->noBacklight();
    writeLcdLine(lcd, 0, "");
    writeLcdLine(lcd, 1, "");
  }
}

void checkRaiseWake(unsigned long now, LiquidCrystal_I2C *lcd) {
  if (!mpuReady || now - lastRaiseSampleAt < RAISE_SAMPLE_INTERVAL_MS) {
    return;
  }

  lastRaiseSampleAt = now;

  if (displayAwake && now >= displayWakeUntil) {
    sleepDisplay(lcd);
  }

  if (!displayAwake && now < displaySleepAllowedAt) {
    return;
  }

  if (az > RAISE_AZ_REJECT) {
    raiseWindowActive = false;
    lastRaiseAz = az;
    return;
  }

  if (!raiseWindowActive) {
    raiseWindowActive = true;
    raiseWindowStartAt = now;
    raiseWindowStartAz = az;
  } else if (now - raiseWindowStartAt > RAISE_TIME_MS) {
    raiseWindowActive = false;
    raiseWindowStartAz = az;
    raiseWindowStartAt = now;
  }

  const float deltaZ = az - raiseWindowStartAz;
  const bool rapidRaise =
      raiseWindowStartAz < RAISE_AZ_LOW &&
      az >= RAISE_AZ_MIN &&
      az <= RAISE_AZ_MAX &&
      fabsf(ax) <= RAISE_AX_MAX &&
      deltaZ >= RAISE_DELTA_Z &&
      (now - raiseWindowStartAt) <= RAISE_TIME_MS;

  if (rapidRaise && !displayAwake) {
    wakeDisplay(now, lcd);
    raiseWindowActive = false;
  }

  lastRaiseAz = az;
}

void updateActivity(unsigned long now) {
  if (!mpuReady || now - lastActivityUpdateAt < ACTIVITY_UPDATE_INTERVAL_MS) {
    return;
  }

  lastActivityUpdateAt = now;

  if (!computeMagVariance(magVariance)) {
    return;
  }

  const uint8_t peaksPerSecond = countPeaksPerSecond();

  if (magVariance < VARIANCE_STILL && gyroMag < GYRO_STILL_MAX) {
    activityLevel = ActivityLevel::Still;
  } else if (magVariance < VARIANCE_FIDGET) {
    activityLevel = ActivityLevel::LightMove;
  } else if (magVariance < VARIANCE_WALK || peaksPerSecond <= 2) {
    activityLevel = ActivityLevel::Walking;
  } else if (magVariance < VARIANCE_RUN || peaksPerSecond <= 3) {
    activityLevel = ActivityLevel::Running;
  } else {
    activityLevel = ActivityLevel::VeryActive;
  }

  if (peaksPerSecond == 0 && magVariance < VARIANCE_STILL) {
    activityLevel = ActivityLevel::Still;
  } else if (peaksPerSecond >= 3) {
    activityLevel = ActivityLevel::Running;
  }

  updateActivityLabel();
}

bool isUserMoving() {
  return magVariance > INACTIVITY_VARIANCE_THRESHOLD;
}

bool isWalkingOrRunning() {
  return activityLevel == ActivityLevel::Walking ||
         activityLevel == ActivityLevel::Running ||
         activityLevel == ActivityLevel::VeryActive;
}

void updateReminderBuzz(unsigned long now) {
  if (!reminderBuzzing) {
    return;
  }

  if (now >= reminderBuzzUntil) {
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
    reminderBuzzing = false;
  }
}

void checkInactivity(unsigned long now, const MotionContext &ctx) {
  if (!mpuReady || ctx.sosUiActive || now - lastInactivityCheckAt < INACTIVITY_CHECK_INTERVAL_MS) {
    return;
  }

  lastInactivityCheckAt = now;
  updateReminderBuzz(now);

  if (isUserMoving() || isWalkingOrRunning()) {
    lastActiveAt = now;
    reminderActive = false;
    return;
  }

  if (lastActiveAt == 0) {
    lastActiveAt = now;
    return;
  }

  if (isQuietHours(ctx.timeConfigured)) {
    return;
  }

  const unsigned long inactiveFor = now - lastActiveAt;
  if (inactiveFor < INACTIVITY_LIMIT_MS) {
    return;
  }

  if (reminderActive && now - lastReminderAt < REMINDER_INTERVAL_MS) {
    return;
  }

  reminderActive = true;
  lastReminderAt = now;
  reminderDisplayUntil = now + REMINDER_DISPLAY_MS;
  reminderBuzzUntil = now + REMINDER_BUZZ_MS;
  reminderBuzzing = true;

  tone(BUZZER_PIN, BUZZER_FREQUENCY_HZ);
  wakeDisplay(now, ctx.lcd);
}

void updateMotionDisplay(unsigned long now, const MotionContext &ctx) {
  if (ctx.lcd == nullptr || ctx.sosUiActive || now - lastDisplayUpdateAt < MOTION_DISPLAY_INTERVAL_MS) {
    return;
  }

  lastDisplayUpdateAt = now;

  if (reminderActive && now < reminderDisplayUntil) {
    writeLcdLine(ctx.lcd, 0, "!! MOVE AROUND !!");
    writeLcdLine(ctx.lcd, 1, "Inactive 30 min");
    return;
  }

  if (reminderActive && now >= reminderDisplayUntil) {
    reminderActive = false;
  }

  if (!displayAwake) {
    return;
  }

  char line1[LCD_COLUMNS + 1];
  snprintf(line1, sizeof(line1), "Steps:%lu  %c", static_cast<unsigned long>(stepCount), activityLabel);
  writeLcdLine(ctx.lcd, 0, line1);

  char line2[LCD_COLUMNS + 1];
  if (ctx.gps != nullptr && ctx.gps->location.isValid()) {
    const int satellites = ctx.gps->satellites.isValid() ? ctx.gps->satellites.value() : 0;
    snprintf(
        line2,
        sizeof(line2),
        "%.4f %dSat OK",
        ctx.gps->location.lat(),
        satellites);
  } else if (ctx.gps != nullptr && ctx.gps->satellites.isValid()) {
    snprintf(line2, sizeof(line2), "GPS %dSat wait", ctx.gps->satellites.value());
  } else {
    snprintf(line2, sizeof(line2), "GPS waiting...");
  }
  writeLcdLine(ctx.lcd, 1, line2);
}

}  // namespace

bool initMotion() {
  if (!stepPrefsOpened) {
    stepPrefs.begin(STEP_PREFS_NAMESPACE, false);
    loadStepCount();
    stepPrefsOpened = true;
  }

  for (uint8_t attempt = 1; attempt <= MPU_BOOT_ATTEMPTS; attempt++) {
    LOG_VERBOSE("MPU init attempt %u/%u...\n", attempt, MPU_BOOT_ATTEMPTS);
    prepareI2cBus();

    if (tryConfigureAnyMpu(/*verbose=*/serialLogVerbose())) {
      mpuReady = true;
      lastActiveAt = millis();
      displayWakeUntil = millis() + DISPLAY_ON_TIME_MS;
      lastMpuRetryAt = millis();
      LOG_EVENT(
          "MPU ready at 0x%02X (WHO_AM_I=0x%02X)\n", mpuAddress, mpuWhoAmI);
      return true;
    }

    delay(200 * attempt);
  }

  mpuReady = false;
  LOG_EVENT_LN(
      "MPU init failed (will retry quietly in background).");
  lastMpuRetryAt = millis();
  return false;
}

void motionTick(unsigned long now, const MotionContext &ctx) {
  // Quiet probe of 0x68/0x69 only — never full I2C scan (that stalls button polling).
  if (!mpuReady && now - lastMpuRetryAt >= MPU_RETRY_INTERVAL_MS) {
    lastMpuRetryAt = now;
    prepareI2cBus();
    if (tryConfigureAnyMpu(/*verbose=*/false)) {
      mpuReady = true;
      lastActiveAt = now;
      displayWakeUntil = now + DISPLAY_ON_TIME_MS;
      LOG_EVENT(
          "MPU ready at 0x%02X (WHO_AM_I=0x%02X)\n", mpuAddress, mpuWhoAmI);
    }
  }

  if (!ctx.sosUiActive) {
    readMpu(now);
    updateSteps(now, ctx.timeConfigured);
    checkRaiseWake(now, ctx.lcd);
    updateActivity(now);
    checkInactivity(now, ctx);
    updateMotionDisplay(now, ctx);
  } else {
    updateReminderBuzz(now);
    if (reminderBuzzing) {
      noTone(BUZZER_PIN);
      digitalWrite(BUZZER_PIN, LOW);
      reminderBuzzing = false;
    }
  }
}

void motionOnButtonPress(unsigned long now, LiquidCrystal_I2C *lcd) {
  wakeDisplay(now, lcd);
}

bool isMpuReady() {
  return mpuReady;
}

uint32_t getStepCount() {
  return stepCount;
}

char getActivityLabel() {
  return activityLabel;
}

const char *getActivityName() {
  switch (activityLevel) {
    case ActivityLevel::Still:
      return "Still";
    case ActivityLevel::LightMove:
      return "Light Move";
    case ActivityLevel::Walking:
      return "Walking";
    case ActivityLevel::Running:
      return "Running";
    case ActivityLevel::VeryActive:
      return "Very Active";
    default:
      return "Unknown";
  }
}
