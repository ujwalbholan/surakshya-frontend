# Suraksha — Flutter Companion App

Women's safety IoT wearable companion app (hybrid build: yellow tracking dashboard + crimson marketing site).

## Run

```bash
export PATH="$HOME/flutter-sdk/bin:$PATH"   # or your Flutter SDK path
cd surakshya-app
flutter pub get
flutter run
```

### Android emulator (recommended)

`flutter run` can fail with `Can't find service: package` if the emulator is still booting or adb is stale. Use the helper script:

```bash
cd surakshya-app
./scripts/run_android.sh
# or a specific device:
./scripts/run_android.sh emulator-5554
```

**Backend URL on emulator:** Surakshya API defaults to `http://10.0.2.2:3000` (see `lib/core/constants/app_constants.dart`). Override with `--dart-define=SURAKSHYA_API_URL=...`.

## Routes

| Path | Screen |
|------|--------|
| `/splash`, `/splash2` | Brand splash |
| `/onboarding` | First-launch intro (routed; splash currently skips when logged out) |
| `/home` | Crimson marketing landing |
| `/login`, `/signup` | Auth against Surakshya (`POST /auth/login`, `/auth/register`) |
| `/guardian/setup` | Guardian invite OTP → set-password activation |
| `/tracking` | Citizen dashboard (map, family list, SOS tab, profile) |
| `/guardians` | Child guardian linking |
| `/parent` | Guardian parent shell (wards, pending accept/reject, invite ward) |
| `/profile` | Redirects into tracking shell (profile is a tab) |

SOS countdown lives **inside** the SOS tab (not a separate `/sos/countdown` route).

## Architecture

- **State:** Riverpod `StateNotifier` (manual providers; no codegen)
- **Navigation:** go_router
- **Maps:** flutter_map + dark OSM tiles (Kathmandu default)
- **Auth / guardians / SOS create:** Surakshya REST (`flutter_secure_storage` for tokens)
- **SOS dual-write:** Surakshya `POST /sos` primary; optional non-blocking AMS dual-write behind `AppConstants.sosDualWriteToAmsEnabled`
- **Device:** geolocator + `permission_handler`, `battery_plus`, `flutter_blue_plus`, local notifications

## Evidence vault

**Not built in this release.** Admin evidence metadata list/create exists on the web/backend; Flutter capture/upload vault and admin decrypt/download are deferred. Do not treat README history mentioning Hive/evidence routes as current scope.
