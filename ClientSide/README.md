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
2. Start development server:
	 - `npm run dev`
3. Build production assets:
	 - `npm run build`
4. Lint:
	 - `npm run lint`

## Environment Variables

Create a `.env` file in `ClientSide` as needed:

- `VITE_API_BASE_URL=/api`

Notes:
- `VITE_API_BASE_URL` defaults to `/api`.
- With default Vite proxy, `/api/*` forwards to `http://localhost:5050`.

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
