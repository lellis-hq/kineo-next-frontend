# Routing

[Documentation index](../README.md) - [Architecture overview](overview.md) - [Authentication](authentication.md)

## Route map

| Path | Purpose |
|---|---|
| `/` | Home: member dashboard or marketing page, chosen from the session |
| `/signin`, `/signup` | Authentication |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/verify-email` | Email verification |
| `/profile` with `/create` and `/edit` | Member profile management |
| `/applications` and `/applications/{id}` | Application tracking, on the locum side |
| `/listings` | Browse open postings: filters and map, members only |
| `/listings/mine` | Published listings and received candidates |
| `/goodbye` | Account-erasure confirmation reached from the emailed link |
| `/terms`, `/privacy` | Legal documents |

The site routes share a layout under the `(site)` route group. The API routes under `/api` are a same-origin proxy to the backend, described in [Services](services.md).

## Route groups

| Group | Location | Role |
|---|---|---|
| Site | `src/app/(site)/` | Pages behind the shared site layout; resolves the session for the home page |
| Auth and standalone | `src/app/signin/`, `signup/`, `goodbye/`, `forgot-password/`, `reset-password/`, `verify-email/` | Self-contained flows outside the site shell |
| Proxy | `src/app/api/[...path]/`, `src/app/api/auth/[...all]/` | Delegates to `lib/backend-proxy.ts` |

## Protected routes

`src/proxy.ts` performs an optimistic session-cookie check on protected routes and redirects guests to `/signin`. It covers `/profile`, `/applications`, and the whole `/listings` prefix.

> **Note** - The cookie check is a fast path, not the only barrier. Every guarded page also resolves the session for real on the server and redirects an `anonymous` state itself. The authoritative check happens on the backend at every API call. See [Authentication](authentication.md).

### The browse feed

`/listings` is member-only behind the same two layers. Its backend endpoints stay anonymous: `GET /replacement-listings` answers a signed-out caller with a 200, never a 401. The page therefore resolves the session state with `fetchServerAuth` and redirects when it is `anonymous`. A `requireMember` guard, which only reacts to a 401, would sail straight past.

The practice side of the same URL prefix, `/listings/mine`, is covered by the prefix guard as well.

## Server and client boundaries

A page resolves session and data on the server and passes the result to a client container. Components never fetch the backend directly. The home page streams its dashboard behind a Suspense boundary; see [Architecture overview](overview.md).
