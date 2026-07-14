# Guardian ↔ Child Linking

Surakshya supports two directions of guardian–child linking. Both use the same `guardian_requests` table and shared `GuardianService` methods, branching on the `direction` field. Getting `child_user_id` / `guardian_user_id` backwards in `guardian_links` silently corrupts data — this document is the source of truth for that mapping.

## Linking directions

| Direction | Who initiates | Who accepts | Creates new account? |
|-----------|---------------|-------------|----------------------|
| `CHILD_TO_GUARDIAN` | Child (`USER`) via `POST /guardians` | Guardian (`GUARDIAN`) via `POST /guardian/requests/:id/accept` | Yes — new guardian user with temp password emailed |
| `GUARDIAN_TO_CHILD` | Guardian via `POST /guardian/add-ward` | Child (`USER`) via `POST /guardians/requests/:id/accept` | No — child must already exist as `USER` |

### `guardian_requests` fields

| Field | `CHILD_TO_GUARDIAN` | `GUARDIAN_TO_CHILD` |
|-------|---------------------|---------------------|
| `requester_id` | Child user id | Guardian user id |
| `requester_name` | Child display name | Guardian display name |
| `target_email` | Guardian email (new account) | Child email (existing account) |
| `target_phone` | Guardian phone | Child phone |
| `target_name` | Guardian display name | Child display name |
| `direction` | `CHILD_TO_GUARDIAN` | `GUARDIAN_TO_CHILD` |
| `status` | `PENDING` → `ACCEPTED` / `REJECTED` | same |

Emails are stored normalized: `trim().toLowerCase()`.

## `guardian_links` orientation (critical)

After any successful accept, **always**:

| Column | Value |
|--------|-------|
| `child_user_id` | The citizen (`USER` role) |
| `guardian_user_id` | The guardian (`GUARDIAN` role) |

DB unique constraint: `(child_user_id, guardian_user_id)` — see migration `1738800000000-BaselineSchema.ts`.

### Link creation on accept

```typescript
// CHILD_TO_GUARDIAN — guardian accepts (Option 2)
child_user_id: request.requester_id   // child was requester
guardian_user_id: userId              // guardian JWT acceptor

// GUARDIAN_TO_CHILD — child accepts (Option 1)
child_user_id: userId                // child JWT acceptor
guardian_user_id: request.requester_id // guardian was requester
```

## Controllers and roles

Two NestJS controllers share `GuardianService`:

| Controller | Base path | Role | Purpose |
|------------|-----------|------|---------|
| `GuardianController` | `/guardians` | `USER` | Child-side: invite guardian, list guardians, child inbox, child accept/reject |
| `GuardianWardController` | `/guardian` | `GUARDIAN` | Guardian-side: list wards, add ward, guardian inbox, guardian accept/reject, ward SOS |
| `GuardianSetupController` | `/guardian` | Public | OTP + set-password onboarding (no JWT) |

### Endpoint map

| Action | Method | Path | Role |
|--------|--------|------|------|
| Invite guardian (Option 2) | POST | `/guardians` | USER |
| List linked guardians | GET | `/guardians` | USER |
| Child pending inbox | GET | `/guardians/requests` | USER |
| Child accept/reject | POST | `/guardians/requests/:id/accept` or `/reject` | USER |
| Invite ward (Option 1) | POST | `/guardian/add-ward` | GUARDIAN |
| Guardian pending inbox | GET | `/guardian/requests` | GUARDIAN |
| Guardian accept/reject | POST | `/guardian/requests/:id/accept` or `/reject` | GUARDIAN |
| List wards | GET | `/guardian/me` | GUARDIAN |
| Ward SOS events | GET | `/guardian/wards/:wardId/sos` | GUARDIAN |
| Send OTP | POST | `/guardian/send-otp` | Public |
| Verify OTP | POST | `/guardian/verify-otp` | Public |
| Set password | POST | `/guardian/set-password` | Public |

## Shared service methods

`getMyRequests(userId, role)` — one method, role branch:

- **GUARDIAN:** `target_email = guardian.email` AND `direction = CHILD_TO_GUARDIAN` AND `status = PENDING`
- **USER:** `target_email = child.email` AND `direction = GUARDIAN_TO_CHILD` AND `status = PENDING`

`acceptRequest(requestId, userId)` — one method, direction branch:

- **CHILD_TO_GUARDIAN:** Guardian must match `target_email`, `phone_verified` required, link as above
- **GUARDIAN_TO_CHILD:** Child (`USER`) must match `target_email` via JWT identity, no extra OTP gate

`rejectRequest` — direction-specific actor checks; child-side `GUARDIAN_TO_CHILD` verifies `child.id === userId`.

## Guardian setup wizard (Option 2 onboarding)

Backend requires **OTP verification before set-password** (`phone_verified` gate on `setPassword`).

**Wizard order** (`/guardian/setup?email=…`):

1. Confirm email (from query param or manual entry)
2. Send OTP → `POST /guardian/send-otp`
3. Verify OTP → `POST /guardian/verify-otp` (sets `phone_verified = true`)
4. Set password → `POST /guardian/set-password` (`oldPassword` = temp from invite email, `newPassword` = chosen password)
5. Redirect to `/login`

This differs from the police activation wizard (password + OTP on `/police/activate`). Reuse UX patterns from `PoliceActivateWizard.tsx`, not a token-first setup URL.

## Frontend surfaces

### Flutter citizen app (`suraksha-app/`) — primary child / user UI

Citizen linking and SOS are **Flutter-only**. There is no web `/app/*` citizen portal.

| Route / screen | Role | Features |
|----------------|------|----------|
| `/login`, `/signup` | Public | Surakshya backend auth (`USER` role only) |
| `/guardian/setup` | Public | Guardian invite OTP → set-password (also on Flutter) |
| Profile tab → **Manage guardians** | USER | Shortcut to guardian linking |
| `/guardians` | USER | Invite guardian (Option 2), pending inbox, linked guardians list |
| `/tracking` | USER | Map, honest family empty states, SOS (Surakshya `POST /sos`) |
| `/parent` | GUARDIAN | Wards, pending accept/reject, invite ward by email, ward SOS |

API client: [`suraksha-app/lib/services/surakshya_api_service.dart`](../suraksha-app/lib/services/surakshya_api_service.dart)

State: [`suraksha-app/lib/features/guardians/guardian_provider.dart`](../suraksha-app/lib/features/guardians/guardian_provider.dart)

Linked guardians feed the family list via `familyMembersProvider` (no mock fallback).

**Dev URLs:** Android emulator `http://10.0.2.2:3000`; iOS simulator / web `http://localhost:3000`; physical device `--dart-define=SURAKSHYA_API_URL=http://<LAN-IP>:3000`.

### Next.js web portal (`frontend/`) — guardian + ops only

| Route | Role | Features |
|-------|------|----------|
| `/guardian` | GUARDIAN | Pending child requests, invite ward, linked wards + SOS links |
| `/guardian/setup` | Public | Guardian onboarding wizard |
| `/guardian/wards/[wardId]/sos` | GUARDIAN | Ward SOS monitoring |

API client: [`frontend/lib/api/guardian.ts`](../frontend/lib/api/guardian.ts)

Auth guard: `GuardianAuthGuard` (`/guardian/*`). No `UserAuthGuard` / `/app` routes.

## Security notes

- Actor identity always from JWT (`userId`), never from request body ids
- Inbox queries scoped by normalized email match — users cannot see requests not addressed to them
- Accept on already-processed requests returns `400` with clear message (idempotent link creation returns "Already linked")
- `GET /guardian/wards/:wardId/sos` verifies `guardian_links` on every request

## Bug fix history (Option 1)

Prior to this work, Option 1 was broken:

1. **List:** `GET /guardians/requests` queried `requester_id = childUserId` — wrong; guardian is requester in `GUARDIAN_TO_CHILD`
2. **Accept:** Required `requester_id === userId` — only guardian could pass, but child calls accept endpoint
3. **Link ids:** Were correct in intent but accept never ran; now uses JWT `userId` as `child_user_id`

Option 2 (`CHILD_TO_GUARDIAN`) path was unchanged.

## Related docs

- [API reference](./guardian-linking-api.md) — full request/response shapes for frontend client
- [E2E checklist](./guardian-linking-e2e.md) — manual and automated verification steps

## Tests

```bash
# Unit tests (direction branches, link orientation)
cd backend && npm test -- guardian.service.spec

# E2E API flows (both directions + access control)
cd backend && npm run test:e2e -- --testPathPatterns=guardian-linking
```
