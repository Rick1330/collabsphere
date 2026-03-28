# CollabSphere

CollabSphere is a realtime collaboration workspace platform built with Next.js, NestJS, Hocuspocus, BullMQ, PostgreSQL, Redis, and local Docker-backed developer services.

## Local Development

### Prerequisites

- Node.js 20 LTS or newer
- pnpm 9.x or newer
- Docker Desktop or a compatible Docker runtime with Compose
- Git

### Current setup flow

The current repo state uses Docker Compose for local infrastructure and `pnpm dev` for app processes.

1. Install dependencies:

```bash
pnpm install
```

2. Copy the local infrastructure env template:

```bash
cp .env.example .env
```

3. Start required Docker services:

```bash
docker compose up -d
```

Optional MinIO:

```bash
docker compose --profile minio up -d
```

4. Verify service health:

```bash
docker compose ps
```

5. Start the app processes:

```bash
pnpm dev
```

### Local service set

Required local Docker services:

- PostgreSQL
- Redis
- MailHog

Optional local Docker service:

- MinIO

Notes:

- Docker Compose reads `.env` for local infrastructure port and credential overrides.
- Keep app runtime-only overrides in `.env.local`; do not commit it.
- If a default port is already in use, update the matching `*_PORT` value in `.env` before starting Compose.
- MailHog UI is available at `http://localhost:8025` with the default ports.
- If `8025` is already in use, set `MAILHOG_UI_PORT` in `.env`, then rerun `docker compose up -d`.
- If the SMTP port `1025` conflicts locally, set `MAILHOG_SMTP_PORT` in `.env` before restarting Compose.

### Need more detail?

See [CONTRIBUTING.md](CONTRIBUTING.md) for troubleshooting, validation checks, and contribution workflow details.
