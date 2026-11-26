# Services

[Documentation index](../README.md) - [Architecture overview](overview.md) - [Getting started](../guides/getting-started.md)

Components never talk to the backend directly. The service layer in `src/lib` fetches through a shared client, adapts raw responses into presentation contracts, and owns the French wording for anything domain-shaped.

## Isomorphic services

The same service functions run in the browser and on the server. The caller passes an `ApiTransport`:

| Transport | Used when | Location |
|---|---|---|
| `browserTransport` | In the browser | `src/lib` |
| `serverTransport` | On the server | `lib/api-transport.server.ts` |

The backend address is read on the server only. In the browser, requests go to this app's same-origin `/api/*` proxy (`src/app/api/[...path]/route.ts` and `src/app/api/auth/[...all]/route.ts`), both delegating to `lib/backend-proxy.ts`. No backend address reaches the client bundle.

> **Note** - There is no `typeof window` check anywhere in the service layer. That is the property the transport injection preserves.

## API client and errors

`lib/api-client.ts` provides typed fetch with injected transport and extracts a typed status from failures. `lib/api-errors.ts` is the single place where a failure becomes a French sentence: screens branch on an `ErrorKind` derived from the extracted status, and a domain with better wording may pass an override.

Nothing classifies a failure by matching on the text of an error message.

## API types

There are two type sources, with different jobs.

| File | Origin | Role |
|---|---|---|
| `lib/types/api.ts` | Hand-written | The contract the services use today |
| `lib/types/api.gen.ts` | Generated from the backend's OpenAPI document | Compared by the route audit; regenerated with `bun run api:types` |

`templates/api.json` documents request DTOs only. Every response shape in `api.ts` was transcribed from real backend output. A field added by the backend will not appear until someone reads it off a response, so treat a missing field as unknown rather than absent. When the backend's OpenAPI document changes, run `bun run api:types` before type-checking.

> **Deferred** - Deriving the response types from OpenAPI instead of transcribing them is on the roadmap; see [Roadmap](../product/roadmap.md).

## Domain services

| Area | Location |
|---|---|
| Dashboard | `src/lib/dashboard/`: service and presentation contracts |
| Listings | `src/lib/listings/`: service and presentation contracts |
| Applications | `src/lib/applications/`: service and presentation contracts |
| Profile | `src/lib/profile-service.ts` |
| Account deletion | `src/lib/account-deletion-service.ts` |
| Legal content | `src/lib/legal/` |

Copy belonging to one screen rather than to a domain, such as button labels and form hints, stays in the component that renders it.
