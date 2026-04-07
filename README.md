# Shoe Testing — Frontend

Next.js (App Router) UI for the Shoe Testing role-based application: admin, client, and tester flows, dashboards, and document workflows.

**Repository:** [github.com/vibhu2208/Shoe-testing-frontend](https://github.com/vibhu2208/Shoe-testing-frontend)

## Requirements

- Node.js 20+ (recommended)
- npm (or pnpm / yarn)

## Setup

```bash
cd frontend
npm install
```

## Environment

Copy `.env.example` to `.env.local`. **Production (Vercel):** set `NEXT_PUBLIC_API_BASE_URL` to your Render backend URL (HTTPS, no trailing slash), e.g. `https://your-api.onrender.com`. Redeploy after changing env vars.

| Variable                     | Where it runs        | Purpose                                      |
|-----------------------------|----------------------|----------------------------------------------|
| `NEXT_PUBLIC_API_BASE_URL`  | Browser / client JS  | All `fetch` calls to the Express API         |
| `BACKEND_URL`               | Next.js API routes   | Server-side proxy to Express (optional)      |

If unset, both default to `http://localhost:5000` for local dev.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Dev server (port 3000)   |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | ESLint                   |

## Related

- Backend API: [Shoe-testing-backend](https://github.com/vibhu2208/Shoe-testing-backend) — run it locally or point `BACKEND_URL` at your deployed API.

## Tech stack

- [Next.js](https://nextjs.org)
- React 19, TypeScript, Tailwind CSS
