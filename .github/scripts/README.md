# GitHub Script Runtime Notes

## TypeScript migration status

- `story-project-gates.test.ts` is TypeScript-backed and runs via `tsx --test`.
- `story-project-gates.js` is intentionally retained as handwritten JavaScript.

## Explicit handwritten-JS exceptions

### `story-project-gates.js`

- Runtime owner: `.github/workflows/story-project-gates.yml` via `actions/github-script`.
- Constraint: the workflow executes on clean runners without `pnpm install`, so TypeScript loaders are not available by default.
- Decision: keep the gate-evaluation module as CommonJS JavaScript to avoid introducing loader/bootstrap dependencies into issue-gate automation.

### `eslint.config.mjs`

- Runtime owner: `pnpm lint` (ESLint flat config entrypoint).
- Constraint: converting config to TypeScript would require extra runtime loading for lint startup.
- Decision: keep `.mjs` for deterministic lint invocation and minimal tooling coupling.
