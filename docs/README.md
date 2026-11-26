# Documentation

[Back to README](../README.md)

This directory is a self-contained documentation set for the Kineo frontend. It describes the product, the architecture, and the local setup, including the backend context needed to run the app. It does not require the backend repository.

## Start here

| Goal | Read |
|---|---|
| Understand what the app offers | [Features](product/features.md) |
| Run the app locally | [Getting started](guides/getting-started.md) |
| Find a page or understand route guarding | [Routing](architecture/routing.md) |
| Understand how sessions work | [Authentication](architecture/authentication.md) |
| Change how data is fetched | [Services](architecture/services.md) |
| Navigate the source tree | [Project structure](reference/project-structure.md) |
| See what is planned | [Roadmap](product/roadmap.md) |

## Product

- [Features](product/features.md) - capabilities for established practitioners, locum doctors, and the member console.
- [Roadmap](product/roadmap.md) - current state, the three planned phases, and undecided items.

## Architecture

- [Overview](architecture/overview.md) - technology choices, layering diagram, server rendering, and performance.
- [Routing](architecture/routing.md) - route table, route groups, the proxy guard, and the browse-feed exception.
- [Authentication](architecture/authentication.md) - Better-Auth sessions, the optimistic and authoritative checks, and the request flow.
- [Services](architecture/services.md) - isomorphic services, transports, error wording, and the API type contract.

## Guides

- [Getting started](guides/getting-started.md) - prerequisites, environment variables, local backend services, and the command reference.

## Reference

- [Project structure](reference/project-structure.md) - annotated source tree and the shell / blocks / services convention.
