#!/usr/bin/env bash
# Run Suraksha on Android emulator after ensuring adb + PackageManager are ready.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEVICE_ID="${1:-emulator-5554}"

if [ $# -gt 0 ]; then
  shift
fi

"$ROOT/scripts/ensure_android_emulator.sh" "$DEVICE_ID"

cd "$ROOT"

echo "-> flutter run -d ${DEVICE_ID} $*"
exec flutter run -d "$DEVICE_ID" "$@"
