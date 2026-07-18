#!/usr/bin/env bash
# Waits until the Android emulator is fully booted and adb can talk to PackageManager.
# Fixes: "Can't find service: package", "Can't find service: activity", adb install failures.
set -euo pipefail

ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
export PATH="$ANDROID_SDK/platform-tools:$ANDROID_SDK/emulator:$PATH"

DEVICE_ID="${1:-emulator-5554}"
MAX_BOOT_WAIT_SEC="${MAX_BOOT_WAIT_SEC:-180}"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Set ANDROID_HOME or install Android SDK platform-tools." >&2
  exit 1
fi

echo "-> Restarting adb server..."
adb kill-server >/dev/null 2>&1 || true
sleep 1
adb start-server
sleep 1

if ! adb devices | awk 'NR>1 && $1 ~ /^emulator-/ && $2=="device" {found=1} END{exit !found}'; then
  echo "No running emulator found." >&2
  echo "Start one from Android Studio Device Manager, or:" >&2
  echo "  emulator -avd Medium_Phone_API_36.1 &" >&2
  exit 1
fi

echo "-> Waiting for ${DEVICE_ID}..."
adb -s "$DEVICE_ID" wait-for-device

echo "-> Waiting for Android boot to complete (up to ${MAX_BOOT_WAIT_SEC}s)..."
elapsed=0
boot=""
while [ "$elapsed" -lt "$MAX_BOOT_WAIT_SEC" ]; do
  if boot=$(adb -s "$DEVICE_ID" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r'); then
    if [ "$boot" = "1" ]; then
      break
    fi
  else
    echo "   adb connection dropped - restarting adb..."
    adb kill-server >/dev/null 2>&1 || true
    sleep 1
    adb start-server
    sleep 1
    adb -s "$DEVICE_ID" wait-for-device
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

if [ "${boot:-}" != "1" ]; then
  echo "Emulator did not finish booting within ${MAX_BOOT_WAIT_SEC}s." >&2
  echo "Try: Device Manager -> Cold Boot Now, or:" >&2
  echo "  adb -s $DEVICE_ID emu kill && emulator -avd Medium_Phone_API_36.1 -no-snapshot-load &" >&2
  exit 1
fi

# PackageManager must respond before `flutter run` can install the APK.
if ! adb -s "$DEVICE_ID" shell pm path android >/dev/null 2>&1; then
  echo "Package manager not ready on $DEVICE_ID." >&2
  echo "Cold boot the emulator and run this script again." >&2
  exit 1
fi

echo "OK: Emulator ${DEVICE_ID} is ready."
