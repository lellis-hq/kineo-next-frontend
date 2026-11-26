# Features

[Documentation index](../README.md) - [Roadmap](roadmap.md)

Kineo connects established practitioners with locum doctors. The interface follows a replacement from publication through application to the day of the assignment.

## Established practitioners

- Publish a locum opening in about two minutes: dates, retrocession, and expectations.
- Receive applications from RPPS-verified locums and choose the right match.
- Review their own published listings and received candidates under `/listings/mine`.

## Locum doctors

- Browse open openings near them and review dates and retrocession at a glance.
- Apply in one click with a personalized message.

## Shared

- Real-time status tracking on every application: sent, viewed, accepted, refused.
- Verified identities checked before activation.
- Free during beta, with no commitment.

## Member console

- Personal dashboard with quick actions, key statistics, an application feed, and a reactivity panel.
- Full profile management: create and edit the professional profile, account information, email change, avatar, and account deletion.
- Profile photo and reusable CV uploaded through the backend's storage disk. The disk is local or S3-compatible, depending on the backend configuration.
- The CV is snapshotted onto each application, so later edits to the reusable CV do not change what a practice owner received.
- Listing photos appear on both the browse feed and the owner detail page.

> **Note** - Storage behavior is configured on the backend, not here. For a local S3-compatible store, the backend runs a RustFS container; see [Getting started](../guides/getting-started.md).

## Current boundaries

The browse feed exists, but there is no public listing detail page and no browse-and-apply flow yet, so `/applications` only tracks applications already sent. There is no `/practices` page. See the [Roadmap](roadmap.md) for what comes next.
