# architecture/README

## Domain
Overall technology stack, modular monolith boundaries, runtime topology, environment configuration, and architecture decision records for CollabSphere.

## Canonical Sources
- `docs/spec/07-architecture/` — technology stack, runtime architecture, ADRs
- `docs/spec/10-realtime/` — realtime topology (Socket.IO, Hocuspocus/Yjs services)
- `docs/spec/14-devops/` — environment layout, deployments, CI/CD
- `docs/spec/06-nfrs/` — cross-cutting constraints that drive architecture decisions

## Included Topics
- High-level system context and major components
- Modular monolith boundaries and internal module layering
- Realtime services (Socket.IO gateway, Hocuspocus/Yjs collaboration layer) and their integration points
- Environment and configuration strategy (local, staging, production)
- Architecture Decision Records (ADRs) and how they map to modules and services

## Related domains
- `quality/` — NFRs, observability, and release readiness that shape architecture
- `collab/` — detailed realtime collaboration engine behavior
- `auth/` — auth/session architecture and security
- `workspaces/`, `documents/`, `tasks/` — core business modules whose boundaries are reflected in the modular monolith design
