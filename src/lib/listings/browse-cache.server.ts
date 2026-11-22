/**
 * Short-lived cache for the two browse reads that are identical for every
 * member: the page of rows and the summary counts.
 *
 * A cached scope cannot read `headers()`, and `serverTransport` does on every
 * call. The caller therefore reads the cookie and passes it in as an argument;
 * it becomes part of the cache key, so one member's answer is never served to
 * another. Only the fields that actually change an answer are keyed: `page`
 * and `sort` belong to the feed, while the facet counts deliberately ignore
 * them (and the specialty) just as the endpoint does.
 */

import { cacheLife, cacheTag } from "next/cache";
import type { ApiTransport } from "../api-client";
import { backendUrl } from "../backend-url.server";
import type { Specialty } from "../types/api";
import type {
  BrowseFacets,
  BrowseListingsData,
  BrowseSort,
} from "./browse-contracts";
import { fetchBrowseListings, fetchFacets } from "./browse-service";

/** How long a member may keep a browse answer before the server regenerates it. */
const BROWSE_LIFETIME = {
  stale: 30,
  revalidate: 15,
  expire: 300,
} as const;

/**
 * The same reach as `serverTransport`, without the request-time header read:
 * in a cached scope the cookie is an argument, not something to look up.
 */
function cookieTransport(cookie: string): ApiTransport {
  return (path, init) =>
    fetch(`${backendUrl()}${path}`, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init?.headers)),
        cookie,
      },
    });
}

export async function getCachedBrowseFeed(
  cookie: string,
  view: {
    page: number;
    sort?: BrowseSort;
    specialty?: Specialty;
    city?: string;
    q?: string;
    startDateFrom?: string;
    startDateTo?: string;
    urgentOnly?: boolean;
  },
): Promise<BrowseListingsData> {
  "use cache";
  cacheLife(BROWSE_LIFETIME);
  cacheTag("browse-feed");

  return fetchBrowseListings(view, cookieTransport(cookie));
}

/**
 * The facets are positional on purpose: a caller passing a whole `view` would
 * put `page` and `sort` in the cache key even though the answer ignores them.
 */
export async function getCachedBrowseFacets(
  cookie: string,
  city?: string,
  q?: string,
  startDateFrom?: string,
  startDateTo?: string,
  urgentOnly?: boolean,
): Promise<BrowseFacets> {
  "use cache";
  cacheLife(BROWSE_LIFETIME);
  cacheTag("browse-facets");

  return fetchFacets(
    { city, q, startDateFrom, startDateTo, urgentOnly },
    cookieTransport(cookie),
  );
}
