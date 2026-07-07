#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>
#include <TinyGPSPlus.h>
#include <Wire.h>
#include <math.h>
#include <time.h>

#include "device_config.h"
#include "motion.h"

namespace {

enum class StepState { WaitForPeak, WaitForValley };

enum class ActivityLevel { Still, LightMove, Walking, Running, VeryActive };

Adafruit_MPU6050 mpu;
Preferences stepPrefs;
bool mpuReady = false;

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

void readMpu(unsigned long now) {
  if (!mpuReady || now - lastMpuReadAt < MPU_READ_INTERVAL_MS) {
    return;
  }

  lastMpuReadAt = now;

  sensors_event_t accel;
  sensors_event_t gyro;
  sensors_event_t temp;
  mpu.getEvent(&accel, &gyro, &temp);

  ax = accel.acceleration.x / 9.80665f;
  ay = accel.acceleration.y / 9.80665f;
  az = accel.acceleration.z / 9.80665f;
  gx = gyro.gyro.x * 57.2957795f;
  gy = gyro.gyro.y * 57.2957795f;
  gz = gyro.gyro.z * 57.2957795f;

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
  stepPrefs.begin(STEP_PREFS_NAMESPACE, false);
  loadStepCount();

  if (!mpu.begin(MPU6050_I2C_ADDRESS, &Wire)) {
    mpuReady = false;
    return false;
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  mpuReady = true;
  lastActiveAt = millis();
  displayWakeUntil = millis() + DISPLAY_ON_TIME_MS;
  return true;
}

void motionTick(unsigned long now, const MotionContext &ctx) {
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
