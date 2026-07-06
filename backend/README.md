# Surakshya — Personal Safety Monitoring Platform

Real-time personal safety monitoring backend. Wearable devices stream GPS telemetry via **MQTT**, data is persisted to **POSTGRES DB**, and live location updates are broadcast through **Socket.IO**. The platform supports multi-role access (USER, GUARDIAN, POLICE, ADMIN), SOS alerting, SMS/email notifications, and JWT-based authentication with refresh token rotation.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Database Migrations](#database-migrations)
  - [Docker Setup](#docker-setup)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
  - [App](#app)
  - [Health](#health)
  - [Auth](#auth)
  - [User](#user)
  - [Device](#device)
  - [Guardians](#guardians)
  - [Admin](#admin)
  - [Police](#police)
  - [Notification](#notification)
  - [Tracking (WebSocket)](#tracking-websocket)
- [Rate Limiting](#rate-limiting)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [CI/CD](#cicd)

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 20+ / 22 | JavaScript runtime |
| **Framework** | NestJS 11 | Backend framework |
| **Language** | TypeScript 5.7 | Type safety |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Relational data + geospatial |
| **ORM** | TypeORM 0.3 | Object-relational mapping |
| **Cache** | Redis 7 | Session store, rate limiting, real-time |
| **Auth** | Passport + JWT | Access/refresh tokens |
| **Real-time** | Socket.IO | Live location streaming |
| **IoT** | MQTT | Device telemetry ingestion |
| **Email** | Resend API / Nodemailer (SMTP) | Transactional emails |
| **SMS** | Twilio | SMS notifications |
| **API Docs** | Swagger / OpenAPI | Interactive API documentation |
| **Validation** | class-validator + class-transformer | DTO validation |
| **Config** | @nestjs/config + dotenv | Environment configuration |
| **CI** | GitHub Actions | Automated lint + test pipeline |
| **Container** | Docker + Docker Compose | Containerized deployment |
| **Package** | pnpm 10 | Package manager |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        Wearable Devices                             │
│                     (MQTT over TCP/TLS)                             │
└────────────────────────┬───────────────────────────────────────────┘
                         │  Topic: gps/tracker/{deviceId}
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│                         MQTT Broker                                 │
│                   (e.g., Mosquitto, EMQX)                           │
└────────────────────────┬───────────────────────────────────────────┘
                         │  Subscribe: gps/tracker/+
                         ▼
┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  MqttService  │───▶│ TrackingService   │───▶│  PostGIS (DB)    │  │
│  │  (mqtt.js)   │    │ (parse + persist) │    │ location_pings   │  │
│  └──────────────┘    └─────────┬─────────┘    └──────────────────┘  │
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   TrackingGateway                              │    │
│  │  emitLocationUpdate() → Socket.IO → room device:{deviceId}    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   REST API Controllers                        │    │
│  │  Auth | User | Device | Guardian | Admin | Police | Notif    │    │
│  │  All behind JwtAuthGuard + RolesGuard                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Supporting Services                         │    │
│  │  RedisService │ TokenService │ EmailService │ SmsService     │    │
│  │  RedisThrottlerStorage 🡘 Redis                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   Swagger UI /api/docs                       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Feature modules** | Each domain (auth, user, device, etc.) is self-contained with controller, service, entities, DTOs, and tests |
| **MQTT → WebSocket pipeline** | Decouples IoT ingestion from real-time delivery via `TrackingIngestService` interface |
| **Redis-backed rate limiting** | Custom `RedisThrottlerStorage` enables distributed rate limiting across multiple instances |
| **Token reuse detection** | Refresh token rotation detects theft — if a rotated token is reused, ALL sessions for that user are revoked |
| **Dual email providers** | Resend (HTTPS API) preferred; Nodemailer/SMTP as fallback. Console stub in non-production |
| **SMS stub mode** | When Twilio is unconfigured, SMS is logged to console for development |

---

## Data Flow

### Device Telemetry Pipeline
```
Wearable Device
      │
      │  MQTT publish to "gps/tracker/{imei}"
      ▼
MQTT Broker (Mosquitto/EMQX)
      │
      │  MqttService.onMessage()
      ▼
TrackingService.ingestMqttMessage(topic, payload)
      │
      ├── Try JSON.parse → ingestJson()
      └── Else → parseDeviceTelemetry() (NMEA $GPGGA/$GPRMC)
               │
               ▼
      TrackingService.ingestTelemetry()
               │
               ├── Find or create Device by IMEI
               ├── Save LocationPing to PostGIS
               └── TrackingGateway.emitLocationUpdate(payload)
                         │
                         ▼
              Socket.IO room "device:{deviceId}"
                         │
                         ▼
              All subscribed WebSocket clients
```

### Authentication Flow
```
Client                    Server                       Redis / DB
  │                         │                            │
  │  POST /auth/login       │                            │
  │────────────────────────▶│                            │
  │                         │  Validate credentials       │
  │                         │───────────────────────────▶│
  │                         │◀───────────────────────────│
  │                         │                            │
  │                         │  Generate access+refresh    │
  │                         │  Store refresh in Redis     │
  │                         │───────────────────────────▶│
  │  { accessToken,         │                            │
  │    refreshToken }       │                            │
  │◀────────────────────────│                            │
  │                         │                            │
  │  GET /user/me           │                            │
  │  Authorization: Bearer  │                            │
  │────────────────────────▶│                            │
  │                         │  Verify JWT (Passport)     │
  │                         │  Extract userId, role      │
  │                         │                            │
  │  { user }               │                            │
  │◀────────────────────────│                            │
```

### SOS Alert Flow
```
User device                Backend                    Guardians / Police
  │                         │                            │
  │  SOS button pressed     │                            │
  │  MQTT: sos/active/{imei}│                            │
  │────────────────────────▶│                            │
  │                         │  Create SosEvent (active)   │
  │                         │  SMS/Email guardians        │
  │                         │  Notify police via WS       │
  │                         │                            │
  │                         │  POST /notification/send-sms│
  │                         │───────────────────────────▶│  Twilio
  │                         │◀───────────────────────────│
  │                         │                            │
  │  MQTT: sos/resolved     │  Police resolves via API    │
  │────────────────────────▶│  PATCH /police/.../resolve  │
  │                         │  SosEvent → resolved        │
```

---

## Database Schema

### Entity Relationship Diagram

```
┌───────────────┐       ┌──────────────────┐       ┌────────────────┐
│     User      │       │     Device       │       │  LocationPing  │
├───────────────┤       ├──────────────────┤       ├────────────────┤
│ id (PK, UUID) │       │ id (PK, UUID)    │       │ id (PK, UUID)  │
│ full_name     │       │ imei (UNIQUE)    │◀──────│ device_id (FK) │
│ email (UNIQUE)│       │ label            │ 1:N   │ latitude       │
│ phone (UNIQUE)│       └──────────────────┘       │ longitude      │
│ password_hash │                                  │ altitudeM      │
│ role (ENUM)   │                                  │ speedKmph      │
│ is_active     │                                  │ satellites     │
│ created_at    │                                  │ hdop           │
│ updated_at    │                                  │ recordedAt     │
└───────┬───────┘                                  │ sos_event_id   │
        │                                         └───────┬────────┘
        │ 1:N                                            │
        │                                                 │ N:1
        ▼                                                 ▼
┌───────────────────┐                           ┌──────────────────┐
│   GuardianLink    │                           │    SosEvent      │
├───────────────────┤                           ├──────────────────┤
│ id (PK, UUID)     │                           │ id (PK, UUID)    │
│ child_user_id (FK)│                           │ device_id (FK)   │
│ guardian_user_id  │                           │ status           │
│ created_at        │                           │ startedAt        │
└───────────────────┘                           │ resolvedAt       │
                                                └──────────────────┘
```

### Tables

#### `users` — Platform users

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `full_name` | VARCHAR(150) | NOT NULL | |
| `email` | VARCHAR(255) | UNIQUE, NULLABLE | |
| `phone` | VARCHAR(30) | UNIQUE, NOT NULL | Normalized (stripped +977, dashes) |
| `password_hash` | TEXT | NULLABLE | bcrypt, 12 rounds |
| `role` | ENUM | NOT NULL, DEFAULT `'USER'` | USER, GUARDIAN, POLICE, ADMIN, SUPER_ADMIN |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT `true` | Soft disable |
| `created_at` | TIMESTAMP | Auto-set | |
| `updated_at` | TIMESTAMP | Auto-updated | |

**Indices:** `idx_users_phone`, `idx_users_role`

#### `device` — Registered wearable devices

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `imei` | VARCHAR | UNIQUE, NOT NULL |
| `label` | VARCHAR | NULLABLE |

#### `location_pings` — GPS telemetry records

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `device_id` | UUID | FK → device.id, CASCADE |
| `sos_event_id` | UUID | FK → sos_events.id, SET NULL |
| `latitude` | DOUBLE PRECISION | NOT NULL |
| `longitude` | DOUBLE PRECISION | NOT NULL |
| `altitude_m` | DOUBLE PRECISION | NULLABLE |
| `speed_kmph` | DOUBLE PRECISION | NULLABLE |
| `satellites` | INT | NULLABLE |
| `hdop` | DOUBLE PRECISION | NULLABLE |
| `recorded_at` | TIMESTAMP | Auto-set |

#### `sos_events` — SOS alert events

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `device_id` | UUID | FK → device.id, CASCADE |
| `status` | VARCHAR | DEFAULT `'active'` |
| `started_at` | TIMESTAMP | Auto-set |
| `resolved_at` | TIMESTAMPTZ | NULLABLE |

#### `guardian_links` — User-guardian relationships

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `child_user_id` | UUID | FK → users.id |
| `guardian_user_id` | UUID | FK → users.id |
| `created_at` | TIMESTAMP | Auto-set |

**Unique constraint:** `(child_user_id, guardian_user_id)`

---

## Environment Variables

### Required

| Variable | Description | Default |
|---|---|---|
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | — |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | — |

### Database

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string (overrides individual vars) | — |
| `DB_HOST` | PostgreSQL host | `127.0.0.1` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `somthing` |
| `DB_NAME` | PostgreSQL database name | `surakshya` |
| `DB_SSL` | Enable SSL connection (`true`/`false`) | `false` |
| `DB_SYNC` | Auto-sync schema (**local development only**; must be `false` in CI/staging/production) | `false` |
| `DB_LOGGING` | SQL query logging (`true`/`false`) | `false` |

### Redis

| Variable | Description | Default |
|---|---|---|
| `REDIS_URL` | Full Redis connection string (overrides host/port/password) | — |
| `REDIS_HOST` | Redis host | `127.0.0.1` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | — |

### JWT

| Variable | Description | Default |
|---|---|---|
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |

### Email (Resend — preferred)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_MAIL_FROM` | Sender address (e.g., `Surakshya <noreply@example.com>`) |

### Email (SMTP — fallback)

| Variable | Description |
|---|---|
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_SECURE` | Use TLS (`true`/`false`) |
| `MAIL_USER` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_FROM` | Sender address |

### SMS

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sending number |

### MQTT

| Variable | Description | Default |
|---|---|---|
| `MQTT_BROKER_URL` | MQTT broker URL | `mqtt://192.168.100.134:1883` |

### Application

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) | `development` |
| `PORT` | HTTP server port | `3000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

### Serial bridge (development hardware)

| Variable | Description | Default |
|---|---|---|
| `SERIAL_PORT` | USB serial device path | `/dev/cu.usbserial-0001` |
| `SERIAL_DEVICE_ID` | Device IMEI/topic id for MQTT publish | `wearable-001` |

Run with `pnpm serial-bridge` (uses `MQTT_BROKER_URL` from the MQTT section above).

---

## Getting Started

### Prerequisites

- **Node.js** 20.x or 22.x
- **pnpm** 10.x (`npm install -g pnpm@10`)
- **PostgreSQL** 16+ with PostGIS (`postgis/postgis:16-3.4`)
- **Redis** 7+

### Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd backend

# 2. Install dependencies
pnpm install

# 3. Create environment file
cp .env .local.env
# Edit .local.env with your local database/redis credentials

# 4. Start PostgreSQL and Redis
# Option A: Use Docker for infrastructure only
docker run -d --name surakshya-postgis \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=somthing \
  -e POSTGRES_DB=surakshya \
  -p 5432:5432 \
  postgis/postgis:16-3.4

docker run -d --name surakshya-redis \
  -p 6379:6379 \
  redis:7-alpine

# Option B: Use Docker Compose for everything
docker compose up -d

# 5. Apply database migrations (required outside local dev)
pnpm migration:run

# 6. Start the development server
pnpm start:dev

# 7. Open in browser
# API:        http://localhost:3000
# Swagger UI: http://localhost:3000/api/docs
```

### Database Migrations

Schema changes are managed with TypeORM migrations. **`DB_SYNC=true` must only be used for local development** — never enable it in CI, staging, or production.

```bash
# Start Postgres (Docker Compose or local instance), then:

# Apply all pending migrations
pnpm migration:run

# Revert the last migration
pnpm migration:revert

# Generate a new migration after entity changes (review SQL before committing)
pnpm migration:generate src/config/database/migrations/DescriptiveName
```

Migration files live in `src/config/database/migrations/`. The TypeORM CLI uses `src/config/database/data-source.ts`, which reads `.local.env` / `.env` for connection settings.

For a fresh local database:

1. Create an empty Postgres database (e.g. `surakshya`).
2. Run `pnpm migration:run`.
3. Optionally set `DB_SYNC=true` only if you are iterating on entities locally and understand the risk — prefer generating migrations instead.

### Docker Setup

```bash
# Build and run the full stack (backend + PostGIS + Redis)
docker compose up --build

# Or build only the backend image
docker build --no-cache -t surakshya-backend .

# Run with infrastructure
docker compose up -d postgres redis
docker run -p 3000:3000 --env-file .local.env surakshya-backend
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:cov

# E2E tests (requires running database)
pnpm test:e2e

# Lint
pnpm lint

# Format
pnpm format
```

**Test setup requires** a running PostgreSQL and Redis instance with the following env vars:

```bash
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=postgres DB_PASSWORD=postgres DB_NAME=surakshya_test pnpm migration:run
DB_HOST=127.0.0.1 DB_PORT=5432 DB_USERNAME=postgres DB_PASSWORD=postgres DB_NAME=surakshya_test REDIS_HOST=127.0.0.1 REDIS_PORT=6379 JWT_ACCESS_SECRET=test-access-secret JWT_REFRESH_SECRET=test-refresh-secret pnpm test
```

---

## API Versioning

The API uses NestJS URI versioning with **version-neutral v1** as the default. All existing routes remain available at their original paths (e.g. `/auth/login`, `/health`) for backward compatibility with the published Flutter app and web clients.

- **Current contract (v1):** unversioned paths and `/v1/...` aliases resolve to the same handlers.
- **Breaking changes:** must ship as a new version (e.g. `/v2/auth/login`) — never mutate response shapes or auth flows on existing v1 routes.
- **New clients:** may adopt explicit `/v1/...` prefixes; mobile app currently calls `/auth/login` per `suraksha-app/lib/services/ams_api_service.dart`.

---

## API Reference

Swagger UI is available at **`/api/docs`** when the server is running.

### Auth

Base path: `/auth`

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | — | 5/min | Register a new user |
| `POST` | `/auth/login` | — | 10/min | Login, returns access + refresh tokens |
| `POST` | `/auth/forgot-password` | — | 3/min | Request password reset OTP by email |
| `POST` | `/auth/verify-reset-otp` | — | 5/min | Verify the OTP sent via email |
| `POST` | `/auth/reset-password` | — | 5/min | Reset password with verified OTP |
| `POST` | `/auth/refresh` | Cookie | — | Refresh access token via `refresh_token` cookie |
| `POST` | `/auth/logout` | Bearer | — | Logout, revoke refresh token, clear cookies |

**Request/Response Examples:**

<details>
<summary>Register</summary>

**Request:**
```json
{
  "full_name": "John Doe",
  "phone": "+9779812345678",
  "email": "john@example.com",
  "password": "securePass123",
  "role": "USER"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "9812345678",
  "role": "USER",
  "is_active": true
}
```
</details>

<details>
<summary>Login</summary>

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response:** `201 Created`
```json
{
  "message": "Login Successfull",
  "user": { "id": "uuid", "full_name": "John Doe", "email": "john@example.com", "phone": "9812345678", "role": "USER" },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```
</details>

---

### User

Base path: `/user`
Guards: `JwtAuthGuard`, `RolesGuard`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/user/me` | Bearer | Any authenticated | Get current user info |
| `GET` | `/user/admin-only` | Bearer | ADMIN | Example admin-only route |
| `GET` | `/user` | Bearer | ADMIN | List all users (excludes self) |
| `GET` | `/user/:id` | Bearer | ADMIN | Get user by ID |
| `PATCH` | `/user/:id` | Bearer | ADMIN | Update user |
| `DELETE` | `/user/:id` | Bearer | ADMIN | Delete user |

---

### Device

Base path: `/device`
Guards: `JwtAuthGuard`, `RolesGuard` (ADMIN only)

| Method | Path | Description |
|---|---|---|
| `POST` | `/device` | Create a new device |
| `GET` | `/device` | List all devices |
| `GET` | `/device/:id` | Get device by ID |
| `PATCH` | `/device/:id` | Update device |
| `DELETE` | `/device/:id` | Delete device |

---

### Guardians

Base path: `/guardians` / `/guardian`
Guards: `JwtAuthGuard`, `RolesGuard`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/guardians` | USER | Add a guardian for current user |
| `GET` | `/guardians` | USER | Get my guardians (paginated: `?page=1&limit=20`) |
| `GET` | `/guardian/me` | GUARDIAN | Get my ward info (paginated: `?page=1&limit=20`) |

---

### Admin

Base path: `/admin`
Guards: `JwtAuthGuard`, `RolesGuard` (ADMIN, SUPER_ADMIN)

| Method | Path | Query Params | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | — | Platform statistics |
| `GET` | `/admin/users` | `?role=&is_active=&search=&page=1&limit=20` | List users (paginated, excludes self) |
| `GET` | `/admin/users/:id` | — | Get user details |
| `PATCH` | `/admin/users/:id/status` | — | Update user active status |
| `PATCH` | `/admin/users/:id/role` | — | Update user role |
| `GET` | `/admin/devices` | `?page=1&limit=20` | List all devices |
| `GET` | `/admin/sos-events` | `?status=active|resolved&page=1&limit=20` | List SOS events |
| `GET` | `/admin/sos-events/:id` | — | Get SOS event details |
| `PATCH` | `/admin/sos-events/:id/resolve` | — | Resolve an SOS event |

**Stats Response:**
```json
{
  "totalUsers": 150,
  "totalDevices": 85,
  "totalPings": 45230,
  "activeSosEvents": 3,
  "usersByRole": [
    { "role": "USER", "count": 100 },
    { "role": "GUARDIAN", "count": 30 },
    { "role": "POLICE", "count": 15 },
    { "role": "ADMIN", "count": 5 }
  ],
  "newUsersToday": 2,
  "pingsToday": 1200,
  "resolvedSosToday": 1
}
```

---

### Police

Base path: `/police`
Guards: `JwtAuthGuard`, `RolesGuard` (POLICE, ADMIN, SUPER_ADMIN)

| Method | Path | Description |
|---|---|---|
| `GET` | `/police/dashboard` | Police dashboard stats |
| `GET` | `/police/sos-events` | Get active SOS events with latest locations |
| `GET` | `/police/sos-events/:id` | Get SOS event details + location history |
| `PATCH` | `/police/sos-events/:id/resolve` | Resolve an SOS event |
| `GET` | `/police/devices/:id/location` | Get device latest location |
| `GET` | `/police/users/:id` | Get user info |
| `GET` | `/police/users/:id/guardians` | Get user's guardians |

**Dashboard Response:**
```json
{
  "activeSosEvents": 3,
  "totalDevices": 85,
  "totalUsers": 150,
  "sosEventsToday": 5,
  "pingsToday": 1200,
  "resolvedToday": [
    { "id": "uuid", "deviceImei": "1234567890", "startedAt": "...", "resolvedAt": "..." }
  ]
}
```

---

### Notification

Base path: `/notification`
Guards: `JwtAuthGuard`, `RolesGuard` (ADMIN, SUPER_ADMIN, POLICE)

| Method | Path | Description |
|---|---|---|
| `POST` | `/notification/send-sms` | Send SMS via Twilio (or console stub) |
| `POST` | `/notification/send-email` | Send email via Resend or SMTP |

---

### Health

Base path: `/health`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-02T22:00:00.000Z",
  "uptime": 12345.67
}
```

### App

Base path: `/`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root endpoint |

---

### Tracking (WebSocket)

**Namespace:** `/tracking`
**Auth:** Pass JWT access token via `handshake.auth.token` or `handshake.query.token`

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `subscribe_device` | `{ deviceId: "imei-123" }` or `"imei-123"` | Subscribe to real-time location updates for a device |
| Client → Server | `unsubscribe_device` | `{ deviceId: "imei-123" }` or `"imei-123"` | Unsubscribe from a device |
| Server → Client | `location_update` | `{ id, deviceId, latitude, longitude, altitudeM, speedKmph, satellites, hdop, recordedAt }` | Real-time location ping |

```js
// Client connection example
const socket = io('https://host/tracking', {
  auth: { token: 'eyJhbGci...' }
});

socket.emit('subscribe_device', { deviceId: 'imei-123' });

socket.on('location_update', (data) => {
  console.log('New location:', data.latitude, data.longitude);
});
```

---

## Rate Limiting

| Scope | Limit | Key |
|---|---|---|
| **Global** | 60 requests / 60s | Per IP |
| `POST /auth/register` | 5 requests / 60s | Per IP |
| `POST /auth/login` | 10 requests / 60s | Per IP |
| `POST /auth/forgot-password` | 3 requests / 60s | Per IP |
| `POST /auth/verify-reset-otp` | 5 requests / 60s | Per IP |
| `POST /auth/reset-password` | 5 requests / 60s | Per IP |

Rate limiting is backed by **Redis** for distributed counting. Storage implemented via custom `RedisThrottlerStorage`.

---

## Authentication

The platform uses **JWT access + refresh token** pattern.

### Access Token
- Stored in `Authorization: Bearer` header or `access_token` cookie
- Short-lived (default: 15 minutes)
- Contains: `userId`, `role`, `sessionId`, `type: 'access'`

### Refresh Token
- Stored in `refresh_token` httpOnly cookie or response body
- Long-lived (default: 7 days)
- Stored in Redis at `auth:refresh:{userId}:{sessionId}`
- On rotation, old token is invalidated
- **Reuse detection:** If a rotated refresh token is reused, ALL sessions for that user are revoked (defends against token theft)

### Cookies
| Cookie | Type | Max-Age | Secure |
|---|---|---|---|
| `access_token` | httpOnly | 15 min | In production |
| `refresh_token` | httpOnly | 7 days | In production |

---

## Role-Based Access Control

| Role | Permissions |
|---|---|
| **USER** | Manage own profile, add guardians, trigger SOS |
| **GUARDIAN** | View ward info and location |
| **POLICE** | View/manage SOS events, device locations, user info |
| **ADMIN** | Full platform management: users, devices, SOS events, roles |
| **SUPER_ADMIN** | Same as ADMIN (distinguished for future escalation) |

Authorization is enforced by `RolesGuard` combined with the `@Roles()` decorator.

---

## Project Structure

```
src/
├── main.ts                          # Entry point, Swagger setup, global pipes
├── app.module.ts                    # Root module, global providers
├── app.controller.ts                # Root endpoint
├── app.service.ts                   # Root service
│
├── config/
│   ├── database/
│   │   └── data-source.ts           # TypeORM CLI DataSource (migrations)
│   └── redis/
│       ├── redis.module.ts          # Redis module
│       ├── redis.service.ts         # Redis client wrapper (ioredis)
│       └── redis-throttler.service.ts  # Redis-backed ThrottlerStorage
│
├── decorators/
│   └── roles.decorators.ts          # @Roles() decorator
│
├── types/
│   └── TokenRelTypes.ts             # Token-related type definitions
│
├── utils/
│   ├── guard/
│   │   ├── jwt-auth.guard.ts        # JWT authentication guard
│   │   └── roles.guard.ts           # Role-based authorization guard
│   ├── strategies/
│   │   └── jwt.strategy.ts          # Passport JWT strategy
│   ├── token/
│   │   ├── token.module.ts          # Token module
│   │   └── token.service.ts         # JWT generation, rotation, revocation
│   └── safe-user.ts                 # Strip password_hash utility
│
└── feature/
    ├── admin/                       # Admin panel backend
    ├── auth/                        # Authentication & password reset
    ├── device/                      # Device CRUD + entities
    ├── guardian/                    # Guardian-ward relationships
    ├── health/                      # Health check
    ├── mqtt/                        # MQTT client for device ingestion
    ├── notification/                # SMS + Email notification services
    ├── police/                      # Police response workflows
    ├── tracking/                    # Telemetry ingestion + WebSocket gateway
    └── user/                        # User management
```

Each feature module follows the same convention:

```
feature/{name}/
├── dto/                             # Input validation DTOs
├── entities/                        # TypeORM entity definitions
├── {name}.controller.ts             # HTTP endpoints
├── {name}.module.ts                 # NestJS module definition
├── {name}.service.ts                # Business logic
├── {name}.controller.spec.ts        # Controller tests
└── {name}.service.spec.ts           # Service tests
```

---

## Deployment

### Docker Build

```bash
docker build --no-cache -t surakshya-backend .
```

### Environment

For production (Render, Railway, etc.), set the following env vars:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
REDIS_URL=rediss://:password@host:6379
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>
RESEND_API_KEY=<resend-api-key>
RESEND_MAIL_FROM=Surakshya <noreply@your-domain.com>
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_PHONE_NUMBER=<twilio-number>
CORS_ORIGIN=https://your-frontend.com
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

- **Triggers:** Push / PR to `main`
- **Services:** PostGIS 16 + Redis 7
- **Matrix:** Node.js 20 and 22
- **Steps:** `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test`

---

## License

Private — internal project.
