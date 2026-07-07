#pragma once

#include <Arduino.h>
#include <LiquidCrystal_I2C.h>
#include <TinyGPSPlus.h>

struct MotionContext {
  bool sosUiActive;
  bool timeConfigured;
  TinyGPSPlus *gps;
  LiquidCrystal_I2C *lcd;
};

bool initMotion();
void motionTick(unsigned long now, const MotionContext &ctx);
void motionOnButtonPress(unsigned long now, LiquidCrystal_I2C *lcd);
bool isMpuReady();
uint32_t getStepCount();
char getActivityLabel();
const char *getActivityName();
