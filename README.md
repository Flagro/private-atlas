# Private Atlas

A personal travel tracker for logging places you've visited (countries and cities).

## Development Setup

### 1. Database (PostgreSQL)

Copy the example env file and configure:

```bash
cp .env.example .env
# Generate AUTH_SECRET: npx auth secret
```

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Then run migrations:

```bash
npm run db:migrate
```

### 2. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Then seed the database with countries and cities:

```bash
npm run db:seed
```

### Useful commands

| Command | Description |
|---------|-------------|
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
