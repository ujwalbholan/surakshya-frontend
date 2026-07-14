# Guardian Linking — E2E Verification Checklist

Phase 7 verification for both guardian ↔ child linking directions. Automated API coverage lives in `backend/test/guardian-linking.e2e-spec.ts`; UI steps are manual.

## Run automated tests

```bash
cd backend
npm run test:e2e -- --testPathPatterns=guardian-linking
```

**Last run:** 6/6 passed (Option 1 full flow, Option 1 auth guards, Option 1 inbox isolation, Option 2 full flow, Option 2 inbox isolation, SOS access control).

---

## Option 1 — `GUARDIAN_TO_CHILD` (guardian invites existing child)

| Step | Action | Expected | Automated |
|------|--------|----------|-----------|
| 1 | Guardian logs in → `/guardian` → **Invite ward** with child's email | `200` — request created | — |
| 2 | Child logs in on Flutter → `/guardians` → **Pending requests** | Shows `GUARDIAN_TO_CHILD` request | ✅ |
| 3 | Child clicks **Accept** | `200` — linked message | ✅ |
| 4 | Query `guardian_links` | `child_user_id` = child JWT id, `guardian_user_id` = requester | ✅ |
| 5 | Child **Guardians** list | Guardian appears | ✅ |
| 6 | Guardian **Wards** list (`GET /guardian/me`) | Child appears | ✅ |
| 7 | Guardian tries `POST /guardians/requests/:id/accept` | `403` (wrong role endpoint) | ✅ |
| 8 | Unrelated child cannot see or accept the request | Empty inbox / `400` on accept | ✅ |

---

## Option 2 — `CHILD_TO_GUARDIAN` (child invites new guardian)

| Step | Action | Expected | Automated |
|------|--------|----------|-----------|
| 1 | Child logs in on Flutter → `/guardians` → **Invite guardian** (name, email, phone) | Guardian account + `CHILD_TO_GUARDIAN` request created; credentials email sent | — |
| 2 | Guardian opens `/guardian/setup?email=…` → send OTP → verify OTP → set password | `phone_verified = true`; can log in | — |
| 3 | Guardian logs in → `/guardian` → **Pending requests** | Shows `CHILD_TO_GUARDIAN` request with child name | ✅ |
| 4 | Guardian clicks **Accept** | `200` — accepted message | ✅ |
| 5 | Query `guardian_links` | `child_user_id` = `requester_id`, `guardian_user_id` = guardian JWT id | ✅ |
| 6 | Unrelated guardian inbox | Empty | ✅ |

---

## Access control & regression

| Check | Expected | Automated |
|-------|----------|-----------|
| `GET /guardian/wards/:wardId/sos` — linked guardian | `200`, empty or populated SOS list | ✅ |
| Same endpoint — unlinked guardian | `403` — not linked to ward | ✅ |
| `/app` loads for `USER` role (no 404) | Citizen shell renders | ✅ build |
| `/app/guardians` route exists | Linking UI compiles | ✅ build |
| `/guardian/wards/[wardId]/sos` still works | Route compiles; API unchanged | ✅ build |
| `/guardian/setup` wizard route | Compiles; OTP-before-password order | ✅ build |

---

## Manual UI walkthrough (both directions)

Prerequisites: backend on `:3000`, frontend on `:3002`, Postgres + Redis up.

### Option 1 UI

- [ ] Register/login as **child** (`USER`) → land on `/app`
- [ ] Register/login as **guardian** (`GUARDIAN`) in a separate browser/incognito
- [ ] Guardian: invite ward by child email on `/guardian`
- [ ] Child: see pending request on `/app/guardians`, accept
- [ ] Confirm guardian sees ward on `/guardian` home
- [ ] Confirm `guardian_links` row in DB has correct orientation

### Option 2 UI

- [ ] Child: invite guardian on `/app/guardians` (new email/phone)
- [ ] Guardian: complete `/guardian/setup` (email → OTP → verify → password)
- [ ] Guardian: log in, accept pending request on `/guardian`
- [ ] Child: guardian appears in linked list on `/app/guardians`
- [ ] Confirm `guardian_links` row orientation in DB

### Unauthorized checks (manual)

- [ ] Third user cannot see another child's `GUARDIAN_TO_CHILD` inbox
- [ ] Third guardian cannot see another guardian's `CHILD_TO_GUARDIAN` inbox
- [ ] Unlinked guardian navigating to `/guardian/wards/{id}/sos` shows error state (403 from API)

---

## `guardian_links` orientation reference

After any successful accept:

| Column | Always |
|--------|--------|
| `child_user_id` | The `USER` (citizen) |
| `guardian_user_id` | The `GUARDIAN` |

Unique constraint: `(child_user_id, guardian_user_id)`.

---

## Frontend routes verified (build)

```
○ /app
○ /app/guardians
○ /guardian
○ /guardian/setup
ƒ /guardian/wards/[wardId]/sos
```
