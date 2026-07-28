# Surakshya

Monorepo for the Surakshya platform web console and marketing site.

## Repository layout

| Path | Description |
|---|---|
| [`frontend/`](frontend/) | Next.js web app — marketing pages, Nepal Police command centre (`/dashboard`), and platform admin console (`/admin`) |
| [`surakshya-app/`](surakshya-app/) | Flutter mobile app — **separate git history and remote**; not tracked in this repository (clone/maintain independently) |

## Getting Started

Install dependencies from the repo root (npm workspaces):

```bash
npm install
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

You can start editing the page by modifying `frontend/app/page.tsx`. The page auto-updates as you edit the file.

### Scripts (from repo root)

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3002 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deploy on Vercel

Set the **Root Directory** to `frontend` in your Vercel project settings.

### Environment variables (Production)

| Variable | Description |
|---|---|
| `SURAKSHYA_API_URL` | Backend origin for `/api/surakshya/*` HTTP proxy (server-side rewrite) |
| `NEXT_PUBLIC_SURAKSHYA_WS_URL` | Backend origin for Socket.IO — connects directly to the API, not via Next.js |

Example (replace with your deployed API host):

```env
SURAKSHYA_API_URL=https://surakshya.onrender.com
NEXT_PUBLIC_SURAKSHYA_WS_URL=https://surakshya.onrender.com
```

`NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.

On the backend, set `CORS_ORIGIN` to your Vercel URL (comma-separated for preview deployments). See [`docs/production-deployment.md`](docs/production-deployment.md) for the full production checklist (migrations, JWT, Redis, CORS).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
