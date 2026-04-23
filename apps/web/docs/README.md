# CollabSphere — Project Documentation

Welcome to the CollabSphere project documentation. This directory captures
the architectural decisions, recovery history, and ongoing corrections that
shape the codebase today.

## Contents

| Doc | Purpose |
|-----|---------|
| [`architecture.md`](./architecture.md) | Tech stack, routing model, folder layout, and conventions. |
| [`routing-recovery.md`](./routing-recovery.md) | Postmortem of the routing/SPA breakage and the fixes applied. |
| [`spec-corrections.md`](./spec-corrections.md) | Behavioral corrections applied across Members, Activity, Notifications, Settings, Workspace Settings, and Admin. |
| [`design-system.md`](./design-system.md) | Design tokens, "warm stone" direction, and the editorial restraint applied to Create Workspace. |
| [`mock-data.md`](./mock-data.md) | Where mock data lives and how to swap it for real APIs. |
| [`changelog.md`](./changelog.md) | Chronological record of significant changes. |

## How to read this

Start with `architecture.md` for the lay of the land, then read
`routing-recovery.md` to understand why the app crashed and what restored it.
`spec-corrections.md` is the behavioral source of truth for the governance,
admin, and ownership-transfer surfaces.
