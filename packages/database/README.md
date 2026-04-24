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

Repo-root `pnpm prisma ...` commands load this worktree's `.env` / `.env.local`
before invoking Prisma so local repo settings win over inherited shell
variables.

## Common Commands

Run from the repo root:

```bash
pnpm prisma validate
pnpm prisma migrate dev --dry-run
pnpm --filter @collabsphere/database run generate
pnpm --filter @collabsphere/database run studio
pnpm --filter @collabsphere/database run migrate:dev -- --name initial_schema_creation
```

`pnpm prisma migrate dev --dry-run` is a repo compatibility wrapper for Prisma
6.x. It runs a read-only schema-to-SQL diff so issue validation steps can use a
non-writing dry-run surface even though upstream `prisma migrate dev` does not
support `--dry-run`.

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
