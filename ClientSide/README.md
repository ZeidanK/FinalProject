# ReconFlow ClientSide

Frontend application for the reconciliation workflow.

## Stack

- React + Vite
- Material UI + Framer Motion
- React Router (protected routes)
- Context-based auth state

## Run Locally

1. Install dependencies:
	- `npm install`
2. Create local environment file:
	- Copy `.env.example` to `.env`
3. Start development server:
	- `npm run dev`
4. Build production assets:
	- `npm run build`
5. Lint:
	- `npm run lint`

Default dev URL is `http://localhost:5173`.

## Environment Variables

Environment values are loaded from `.env` (or `.env.local`) in `ClientSide`.

- `VITE_API_BASE_URL`: API base URL used by frontend service modules.
	- Default behavior in code: `/api`
	- Recommended for local dev: `/api`

Proxy behavior in local dev:
- When `VITE_API_BASE_URL=/api`, Vite forwards `/api/*` to `http://localhost:5050` via `vite.config.js`.
- This avoids browser CORS issues during local development.

Production behavior:
- Set `VITE_API_BASE_URL` to your deployed API base path if it is not `/api`.

## Startup Checklist

1. Start backend API (default local target: `http://localhost:5050`).
2. Start frontend with `npm run dev` in `ClientSide`.
3. Open the app and verify login works.
4. If requests fail, check browser network tab for `/api/*` calls.

## Troubleshooting

- Issue: requests fail with network error in browser.
	- Verify backend is running on `http://localhost:5050`.
	- Verify `.env` value for `VITE_API_BASE_URL`.
	- If using `/api`, confirm Vite dev server is running (proxy is only active in dev server).

- Issue: CORS errors in local development.
	- Use `VITE_API_BASE_URL=/api` so Vite proxy handles cross-origin forwarding.
	- Avoid pointing directly to backend origin during local dev unless backend CORS is configured.

- Issue: auth-protected endpoints return 401.
	- Log out and log in again to refresh token.
	- Ensure backend and frontend are targeting the same environment.

## Current Route Map

Public routes:
- `/`
- `/login`
- `/register`

Protected routes:
- `/dashboard`
- `/invoices` (accountant roles)
- `/matches` (accountant roles)
- `/anomalies` (accountant roles)
- `/reports` (business owner roles)

## Client Architecture

- `src/context/AuthContext.jsx`
	- Centralized auth session source of truth
	- `login`, `logout`, and session state

- `src/services/httpClient.js`
	- Shared request utility
	- Query serialization
	- Auth header injection
	- Normalized API errors

- `src/scripts/config.js`
	- Endpoint map aligned to reconciliation backend controllers
	- App flags (`apiBaseUrl`, `useMockApi`)

- `src/services/*`
	- Domain service modules: auth, invoices, bank accounts, transactions, matches, anomalies, reports, dashboard, companies

## Immediate Next Frontend Tasks

1. Add company-selection context so pages no longer use fallback company id.
2. Wire each feature page to its service module with loading/empty/error states.
3. Add notification provider for global success/error toasts.
4. Introduce test setup (Vitest + RTL + MSW) for auth + protected routes.
