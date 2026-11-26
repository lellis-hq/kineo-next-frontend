# Roadmap

[Documentation index](../README.md) - [Features](features.md)

The platform is evolving beyond the core user journey. The phases below are a rough order of priority; checkboxes show what exists today.

## Phase 1 - Core product experience

- [x] **Live listings.** Publish and browse openings under `/listings`, with filters and a map. Per-specialty counts come from `GET /replacement-listings/facets`. `/listings/mine` covers the practice's own listings.
  - The feed's sort control is a server parameter: `GET /replacement-listings` accepts `sort=recent|urgent|startDate` and orders the whole collection before paging, with `id` as the tiebreak so a re-sort never reorders a page twice. The frontend sends it from `browse-service.ts`, puts it in the URL, and keeps a sorted feed shareable.
- [ ] **Apply to a listing.** `/applications` tracks applications already sent, but there is no browse-and-apply flow and no public listing detail page for a row to open.
- [ ] **Pricing page.** Fills the last placeholder link in the product navigation.
- [ ] **Practices page.** There is no `/practices` page and nothing links to one; the practice side is `/listings/mine` for now.

## Phase 2 - Trust and network effects

- [ ] **Verified profile depth.** Richer RPPS-backed credentials, specialty and experience badges visible to both sides.
- [ ] **Reactivity and response-time signals.** Surface average response times to encourage faster and more reliable matching.

## Phase 3 - Reliability and scale

- [ ] **CI.** `src/lib` has unit tests through `bun run test` with Bun's own runner, but there is no CI yet. The API client's error parsing and the GDPR erasure flow remain unverified; the adapters the browse feed depends on are covered.
- [ ] **Component tests.** Screen logic outside `src/lib` is covered only by manual exercise, above all the map's WebGL lifecycle.
- [ ] **A generated API contract.** Derive response types from the OpenAPI document instead of transcribing them, so a backend field change surfaces as a type error.
- [ ] **Web Vitals monitoring.** Instrument and report core performance metrics.
- [ ] **Design-system consolidation.** Unify component naming and surface styles across pages.

## Not decided yet

- Notifications, by email or push, and calendar sync for openings.
- Feedback and ratings between practitioners after a completed assignment.
