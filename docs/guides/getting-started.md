# Getting started

[Documentation index](../README.md) - [Architecture overview](../architecture/overview.md) - [Services](../architecture/services.md)

## Prerequisites

- Bun.
- A Node-compatible runtime for Next.js.
- A running Kineo backend. It is the authentication server and the source of all data. The frontend does not work against a mock: sign-in, the feed, and the member console all resolve through the API.
- For S3 uploads: the backend's RustFS container. The local storage driver needs no extra service.

## Environment

Copy `.env.example` to `.env`, then set:

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Where the backend answers. Read on the server only; required in production, with no fallback outside development. |
| `NEXT_PUBLIC_FRONTEND_URL` | Public base URL of this app, used for links sent by email |
| `ALLOWED_DEV_ORIGINS` | Optional extra hosts allowed to open the dev server, for example a phone on the local network |

No backend address reaches the client bundle. The browser uses this app's same-origin `/api/*` proxy; server components call the backend directly.

> **Warning** - This app must not be reachable directly. Next fills `X-Forwarded-For` from the socket only when the header is absent, and this app forwards the header as received. Put a reverse proxy in front that overwrites it with the real client address, or use a platform that does the same. On the backend, list that proxy and this app's own address in `TRUST_PROXY_IPS`. See [Authentication](../architecture/authentication.md).

## Backend services

The backend needs PostgreSQL and, in development, Mailpit for email. For a local S3-compatible store, start its RustFS container from the backend repository:

```bash
docker compose --profile s3 up -d rustfs
```

Uploads use the backend's configured storage driver: `local` needs no extra service, while `s3` needs that container. The CV is snapshotted onto each application by the backend, and listing photos are served through its authenticated file routes.

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Development server on port 3001 |
| `bun run build` | Production build: type-check and compile |
| `bun run start` | Serve the production build |
| `bun run typecheck` | Route type generation followed by `tsc --noEmit` |
| `bun run lint` | Lint and format check with Biome |
| `bun run format` | Auto-format code with Biome |
| `bun run test` | Unit tests for `src/lib`, using Bun's runner |
| `bun run knip` | Find unused files, exports, and dependencies |
| `bun run api:types` | Regenerate `src/lib/types/api.gen.ts` from the backend's OpenAPI document |

```bash
bun install
bun run dev
```

When the backend's OpenAPI document changes, run `bun run api:types` before type-checking. `src/lib/types/api.gen.ts` is the contract the route audit compares against; the hand-written `api.ts` is what the services use today. See [Services](../architecture/services.md).

## Next steps

- [Routing](../architecture/routing.md) for the page map and protected routes.
- [Project structure](../reference/project-structure.md) before adding a component or a service.
- [Roadmap](../product/roadmap.md) for known gaps.
