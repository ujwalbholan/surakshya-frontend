# Police Onboarding Flow

End-to-end flow for inviting police officers and activating their accounts.

## Architecture

All police onboarding endpoints live on the **Surakshya backend** (`backend/`), proxied by the frontend at `/api/surakshya/*`. The AMS backend (`/api/ams`) is not used for this flow.

## Flow

1. **Admin creates a police station** — `POST /admin/police-stations` (ADMIN or SUPER_ADMIN JWT)
2. **Admin invites an officer** — `POST /admin/police/invite` with name, email, phone, and `station_id`
   - Creates inactive `POLICE` user + invite row
   - Sends email with activation link (`/police/activate?...`) and temporary password
3. **Officer activates** — public activation wizard on `/police/activate`:
   - `POST /police/activation/set-password`
   - `POST /police/activation/verify-otp` (after send-otp)
4. **Officer logs in** — `POST /auth/login` via Surakshya → redirected to `/dashboard`

## Environment variables

See `backend/.env.example`:

- `POLICE_INVITE_TTL_HOURS` — invite link expiry (default 72)
- `POLICE_TEMP_PASSWORD_LENGTH` — temp password length (default 14)
- `FRONTEND_URL` — base URL for invite links in emails

## Security

- Invite tokens stored as SHA-256 hashes only
- Temp passwords never returned in API responses
- OTP rate-limited (3 sends/hour, 5 verify attempts per code)
- Inactive users cannot log in until OTP verification completes

## Frontend routes

| Route | Purpose |
|---|---|
| `/admin/police-stations` | List/create stations |
| `/admin/police/invite` | Invite officer form |
| `/police/activate` | Officer activation wizard (replaces legacy `/police/setup`) |
| `/dashboard` | Police dashboard (live `/police/*` APIs) |
