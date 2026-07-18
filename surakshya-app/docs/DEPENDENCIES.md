# Suraksha App — Dependency Notes (post Track A/B)

Flutter/Dart project. Dependencies are declared in [`pubspec.yaml`](../pubspec.yaml).

## Intentionally retained (used)

| Package | Purpose |
|---------|---------|
| flutter_riverpod | State |
| go_router | Routing |
| google_fonts | Typography |
| geolocator + geocoding + latlong2 | Live GPS |
| permission_handler | Runtime location permission (Phase 2) |
| battery_plus | Real battery % (Phase 2) |
| flutter_blue_plus | BLE band connection state |
| flutter_secure_storage | JWT token storage |
| shared_preferences | Session / onboarding flags |
| http | Surakshya + AMS clients |
| flutter_local_notifications | SOS notifications |
| flutter_map | Tracking map |
| url_launcher, intl, marquee, smooth_page_indicator | UI helpers |

## Removed in Track B cleanup

`flutter_svg`, `shimmer`, `visibility_detector`, `uuid`, `collection` (direct), `riverpod_annotation`, `riverpod_generator`, `build_runner`.

## Not present / deferred

- **Hive / evidence vault packages** — deferred (no capture vault this round)
- **3D GLB viewer** — `wristband.glb` removed; splash uses CustomPaint
