# @collabsphere/database

Prisma schema, migrations, and generated database client for CollabSphere.

## Scope

- Canonical Prisma schema: `prisma/schema.prisma`
- Tracked migrations: `prisma/migrations/*`
- Generated Prisma client surface re-exported from `src/index.ts`

## Environment

Required environment variable:

- `DATABASE_URL`

Local default from `.env.example`:

```bash
DATABASE_URL=postgresql://collab:collab@localhost:5432/collabsphere
```

## Common Commands

Run from the repo root:

```bash
pnpm prisma validate
pnpm --filter @collabsphere/database run generate
pnpm --filter @collabsphere/database run studio
pnpm --filter @collabsphere/database run migrate:dev -- --name initial_schema_creation
```

Run directly from `packages/database`:

```bash
pnpm validate
pnpm generate
pnpm studio
pnpm migrate:dev --name initial_schema_creation
```

## Prisma Studio

Prerequisites:

1. PostgreSQL is running locally.
2. `DATABASE_URL` points at the intended local database.
3. Dependencies are installed with `pnpm install`.

Open Prisma Studio:

```bash
pnpm --filter @collabsphere/database run studio
```

## Working Rules

- Treat `schema.prisma` and tracked migrations as code-reviewed delivery artifacts.
- Use additive migrations where possible.
- Keep workspace scoping and `deleted_at` behavior aligned with `docs/agent-ref/data/*`.
- Do not hand-edit production databases outside tracked migrations.
