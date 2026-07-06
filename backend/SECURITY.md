# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main (latest deploy) | Yes |
| older tags | No |

## Reporting a Vulnerability

If you discover a security issue in the Surakshya API, web admin, MQTT ingest path, or mobile client integrations, please report it responsibly.

**Contact:** security@surakshya.app (PGP key available on request)

**Please include:**

- Description of the issue and likely impact
- Steps to reproduce (proof-of-concept if available)
- Affected endpoints, versions, or components
- Your contact for follow-up

**Do not** open public GitHub issues for undisclosed security vulnerabilities.

## Response Timeline

| Stage | Target |
| ----- | ------ |
| Acknowledgement | Within 48 hours |
| Initial triage & severity assessment | Within 5 business days |
| Fix or mitigation plan | Within 30 days for high/critical issues |
| Coordinated disclosure | After fix is deployed or mitigations are in place |

## In Scope

- Surakshya NestJS API (authentication, authorization, SOS/location data access)
- Database and Redis session/token handling
- MQTT telemetry and SOS event ingestion
- Notification delivery (SMS/email) configuration and failure modes
- Admin/police/emergency location lookup endpoints and audit logging

## Out of Scope

- Physical wearable hardware and firmware (report to device vendor/manufacturer)
- Third-party providers (Twilio, Resend, hosting platform) — report to those vendors directly
- Social engineering attacks against individual users
- Denial-of-service attacks without a practical, reproducible application-level flaw

## Safe Harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, service degradation, and data destruction
- Report issues promptly through the channel above
- Allow reasonable time for remediation before public disclosure

Thank you for helping keep Surakshya users safe.
