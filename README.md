# Surakshya

Monorepo for the Surakshya platform web console and marketing site.

## Repository layout

| Path | Description |
|---|---|
| [`frontend/`](frontend/) | Next.js web app — marketing pages, Nepal Police command centre (`/dashboard`), and platform admin console (`/admin`) |
| [`suraksha-app/`](suraksha-app/) | Flutter mobile app — **separate git history and remote**; not tracked in this repository (clone/maintain independently) |

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

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
