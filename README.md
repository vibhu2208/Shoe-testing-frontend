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

Create a `.env.local` in this folder (it is gitignored). Server-side API routes use the backend base URL:

| Variable       | Description                          | Example                 |
|----------------|--------------------------------------|-------------------------|
| `BACKEND_URL`  | Base URL of the Shoe Testing API     | `http://localhost:5000` |

If `BACKEND_URL` is omitted, API routes default to `http://localhost:5000`.

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
