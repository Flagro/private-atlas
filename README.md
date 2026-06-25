# Private Atlas

A personal travel tracker for logging places you've visited (countries and cities).

## Development Setup

### 1. Install dependencies

```bash
npm ci
```

### 2. Database (PostgreSQL)

Copy the example env file and configure:

```bash
cp .env.example .env
# Generate AUTH_SECRET: npx auth secret
```

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

The database container includes a readiness check. Confirm it is healthy with
`docker compose ps` before running migrations.

Then run migrations:

```bash
npm run db:migrate
```

Seed the database with countries and cities:

```bash
npm run db:seed
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit tests |
| `npm run check` | Run lint, type-checking, tests, and production build |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Create and apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Seed countries and major cities |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:push` | Push schema changes without migration (dev only) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth secret — generate with `npx auth secret` |
| `AUTH_URL` | Public site URL (e.g. `https://your-domain.com`) — set in production so OAuth callbacks and auth URLs resolve correctly behind proxies or custom hosts |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `DISABLE_SECURITY_CSP` | Set to `1` only to disable the production CSP while debugging |
| `FORCE_HSTS` | Set to `1` only when production is served exclusively over HTTPS |

## Request Logging

API routes emit one structured JSON log on completion with a request ID, stable
route name, method, status, and duration. Query values, request bodies, and user
data are not logged. The request ID is also returned in the `x-request-id`
response header.
