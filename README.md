# Kineo - Frontend

Web frontend for Kineo, a platform for medical locum work in France. Established practitioners publish a cover opening and receive verified applications; locum doctors browse openings and apply. The interface follows every application to the day of the assignment, on both sides of the table.

This repository contains only the frontend. It needs a running `kineo-nest-backend`, which is the single authentication server and owns all business data. This documentation set is self-contained: it contains the backend context required to run and understand the frontend.

## At a glance

| | |
|---|---|
| Framework | Next.js 16, App Router |
| Language | TypeScript 5 |
| Runtime | React 19 |
| Styling | Tailwind CSS 4 |
| Map | MapLibre GL with OSM raster tiles |
| Auth | Better-Auth sessions, validated by the Kineo API |
| Tooling | Bun, Biome |
| Development port | 3001 |

## Documentation

This README is the entry point. All detail lives in a self-contained documentation set under [`docs/`](docs/README.md).

| Area | Document | Covers |
|---|---|---|
| Product | [Features](docs/product/features.md) | What each audience can do |
| Product | [Roadmap](docs/product/roadmap.md) | Current state and planned phases |
| Architecture | [Overview](docs/architecture/overview.md) | Stack, layering, server rendering, performance |
| Architecture | [Routing](docs/architecture/routing.md) | Route map, route groups, protected routes |
| Architecture | [Authentication](docs/architecture/authentication.md) | Sessions, the two checks, the auth flow |
| Architecture | [Services](docs/architecture/services.md) | Data layer, transports, errors, API types |
| Guides | [Getting started](docs/guides/getting-started.md) | Setup, environment, commands |
| Reference | [Project structure](docs/reference/project-structure.md) | Directory layout and its conventions |

## Quick start

Requires Bun and a running backend reachable at `BACKEND_URL`.

```bash
bun install
cp .env.example .env
bun run dev
```

The dev server listens on port 3001. When the backend's OpenAPI document changes, run `bun run api:types` before type-checking. See [Getting started](docs/guides/getting-started.md) for storage drivers, generated types, and the full command list.

## Relationship to the backend

The browser never learns the backend address. It talks to this app's same-origin `/api/*` proxy, while server components call the backend directly. Backend URLs stay on the server and never reach the client bundle. Authentication is a backend concern: this app forwards the session and relies on the API for every validation. See [Services](docs/architecture/services.md) and [Authentication](docs/architecture/authentication.md).

## Companion repository

`kineo-nest-backend` is the API behind this client. It is documented independently in its own repository, and this documentation set does not depend on it.
