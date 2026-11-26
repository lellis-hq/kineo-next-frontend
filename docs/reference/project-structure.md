# Project structure

[Documentation index](../README.md) - [Architecture overview](../architecture/overview.md)

```text
src/
├── app/                        # Routes (App Router): thin page shells
│   ├── (site)/                 # Routes behind the shared site layout
│   │   ├── page.tsx            # Home: dashboard or marketing content
│   │   ├── applications/       # Application tracking, locum side
│   │   ├── listings/mine/      # Published listings, practice side
│   │   ├── profile/            # Profile management
│   │   ├── privacy/            # Legal document
│   │   ├── terms/              # Legal document
│   │   └── loading.tsx         # Streaming fallback for the site shell
│   ├── signin/                 # Authentication
│   ├── signup/                 # Authentication
│   ├── goodbye/                # Account-erasure confirmation
│   ├── forgot-password/        # Password recovery
│   ├── reset-password/         # Password recovery
│   ├── verify-email/           # Email verification
│   ├── api/                    # Same-origin proxy to the backend
│   │   ├── [...path]/route.ts      # Data routes
│   │   └── auth/[...all]/route.ts  # Auth routes
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/                 # Reusable presentational blocks
│   ├── atoms/                  # Small primitives
│   ├── molecules/              # Reusable groups
│   ├── organisms/              # Data-driven sections
│   └── templates/              # Layout and orchestration containers
├── lib/                        # Services and shared logic
│   ├── dashboard/              # Dashboard service and presentation contracts
│   ├── listings/               # Listings service and presentation contracts
│   ├── applications/           # Applications service and presentation contracts
│   ├── files/                  # Upload adapters
│   ├── legal/                  # Legal content
│   ├── map/                    # Map integration
│   ├── hooks/                  # Shared hooks
│   ├── types/                  # API types: api.ts, api.gen.ts, api.contract.spec.ts
│   ├── api-client.ts           # Typed fetch with injected transport
│   ├── api-errors.ts           # The single place a failure becomes a sentence
│   ├── api-transport.server.ts # Server transport
│   ├── auth-client.ts          # Better-Auth client
│   ├── backend-proxy.ts        # Shared implementation of the /api proxy routes
│   ├── require-member.ts       # Server-side member guard
│   ├── server-auth.ts          # Per-request cached session resolution
│   └── ...                     # Navigation, formatting, marketing, UI tokens
└── proxy.ts                    # Next 16 proxy: optimistic auth guard
```

## The shell, blocks, services convention

A page resolves the session and the data on the server, then hands the result to a client container. Templates own layout and orchestration; organisms are the data-driven sections; molecules group primitives; atoms are the smallest reusable units. Components do not fetch from the backend: that is the service layer's job. See [Architecture overview](../architecture/overview.md) and [Services](../architecture/services.md).

## Two boundaries to respect

- **Client and server.** The backend address is read only on the server. Browser requests go through the same-origin `/api` proxy; server components call the backend directly.
- **Guard and truth.** `proxy.ts` is a fast cookie check. Each guarded page resolves the session again on the server, and the backend validates it on every API call. See [Routing](../architecture/routing.md).
