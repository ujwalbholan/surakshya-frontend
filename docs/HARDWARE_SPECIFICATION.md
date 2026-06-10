# Suraksha Hardware — Canonical Specification

This document resolves inconsistencies found across the marketing site and police dashboard UI. Use these values in the concept paper unless the hardware team publishes an official spec sheet.

## Canonical values (recommended for concept paper)

| Attribute | Canonical value | Rationale |
|-----------|-----------------|-----------|
| **Water resistance** | **IP67** | Stated in hero narrative ([`components/hero/TextPanels.tsx`](../components/hero/TextPanels.tsx) — Protection panel). IP67 (dust-tight, immersion to 1 m) matches an outdoor safety wearable better than IPX4. |
| **SOS trigger (emergency)** | **Double-tap** | Police dashboard, mock data, and operational flows consistently use `double_tap` ([`lib/dashboard/mock-data.ts`](../lib/dashboard/mock-data.ts), [`SosAlertsView.tsx`](../components/dashboard/views/SosAlertsView.tsx)). Reduces accidental alerts vs single tap. |
| **SOS trigger (marketing)** | **“One tap”** (user-facing phrase) | Public copy uses “One Tap SOS” for simplicity ([`InnovationSection.tsx`](../components/InnovationSection.tsx), [`AppFeaturesScroll.tsx`](../components/AppFeaturesScroll.tsx)). |
| **Connectivity** | Bluetooth 5.0 BLE | Consistent across hero, craft, navbar |
| **Materials** | Aerospace-grade (marketing claim) | Hero Protection panel |

## How to describe SOS in the concept paper

> The Suraksha wristband activates an emergency SOS via a **double-tap** on the sensor (confirmed in the Nepal Police command-centre workflow). Marketing materials may refer to **“one tap”** as shorthand for a single deliberate gesture; the production police integration expects **double-tap** to limit false positives.

## Discrepancy log (source files)

| Topic | Location A | Location B |
|-------|------------|------------|
| Water rating | IP67 — `TextPanels.tsx` (Protection) | IPX4 — `CraftSection.tsx` |
| SOS gesture | Double-tap — dashboard, mock data, `SosAlertsView` | Single tap — `InnovationSection`, `ProductShowcase`, metadata |
| Trigger type enum | `triggerType: "double_tap"` — `mock-data.ts` | — |

## Action for hardware team

- [ ] Confirm final ingress protection rating (IP67 vs IPX4)
- [ ] Confirm production SOS gesture (double-tap only vs configurable single/double)
- [ ] Publish official datasheet for concept paper appendix

*Last aligned from codebase: May 2026*
