# ResolveDesk

ResolveDesk is a JavaScript only multi tenant helpdesk built with React, Vite, Redux Toolkit, Express, MongoDB, and Mongoose. The app includes a customer support dashboard, ticket queue, customer and team directories, reporting, settings, a customer portal, JWT auth, org scoped APIs, and authenticated Socket.IO rooms.

## Run locally

1. Install Node.js 20+ and MongoDB 7+.
2. Copy `.env` to `backend/.env` and set distinct JWT secrets. Configure `MONGO_URI` for your MongoDB instance and `CLIENT_URL` for the frontend origin.
3. From the repository root run `npm install`, then `npm run seed` to create the two demo workspaces.
4. Run `npm run dev`. The frontend is at http://localhost:5173, the API is at http://localhost:4000/api, and Swagger docs are at http://localhost:4000/api-docs.

### Demo accounts

All seeded accounts use password `Resolve123!`.

| Workspace | Role | Email |
|---|---|---|
| Acme Support | Admin | `admin@acme.demo` |
| Acme Support | Agent | `agent@acme.demo` |
| Acme Support | Customer | `customer@acme.demo` |
| Northstar Labs | Admin | `admin@northstar.demo` |
| Northstar Labs | Agent | `agent@northstar.demo` |
| Northstar Labs | Customer | `customer@northstar.demo` |

The frontend can display clearly labeled sample data when an API read is unreachable. Sample mode is read only; mutations return an error and do not claim to succeed.

## API

`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`; `GET|POST /api/tickets`, `GET|PATCH|DELETE /api/tickets/:id`, `POST /api/tickets/:id/messages`; `GET|POST /api/customers`, `GET|POST /api/team`, `PATCH /api/team/:id`; `GET /api/dashboard`, `GET /api/analytics`, `GET|PATCH /api/settings`, `PATCH /api/profile`. Authenticated socket clients join `org:<organizationId>` and receive ticket created, updated, and message events.

Every tenant API query uses the organization id in the verified access JWT. Customer ticket queries additionally use the authenticated user id. Never pass organization ids from browser input.

## Environment

`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `PORT`, `VITE_API_URL`; optional `REDIS_URL` enables Bull SLA reminder enqueueing. The application starts without Redis. For frontend builds set `VITE_API_URL` to the deployed API base.

## Docker and deployment

Run `docker compose up --build` for the frontend, backend, and MongoDB. Set `REDIS_URL=redis://redis:6379` and use `docker compose --profile redis up --build` to include Redis. Frontend Vercel SPA rewrite config is in `frontend/vercel.json`; Render backend config is in `backend/render.yaml`.

## Commands

- `npm run dev` starts frontend and backend.
- `npm run build` builds the frontend.
- `npm test` runs backend tests.
- `npm run seed` seeds two isolated organizations and sample users, tickets, and messages.
