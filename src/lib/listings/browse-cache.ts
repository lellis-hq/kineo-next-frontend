import { readBrowseCache, writeBrowseCache } from "@/lib/browse-cache";
import type { BrowseListingsData, BrowseView } from "./browse-contracts";
import {
  BROWSE_PAGE_SIZE,
  browseQuery,
  fetchBrowseListings,
} from "./browse-service";

/** The rows cache key includes everything the listing read depends on. */
export function browseRowsKey(view: BrowseView): string {
  return browseQuery(view, {
    page: view.page,
    limit: view.limit ?? BROWSE_PAGE_SIZE,
    sort: view.sort,
  });
}

export function cachedBrowseRows(view: BrowseView) {
  return readBrowseCache<BrowseListingsData>(browseRowsKey(view));
}

export function rememberBrowseRows(view: BrowseView, data: BrowseListingsData) {
  writeBrowseCache(browseRowsKey(view), data);
}

/** Warm the cache on a pager hover; a miss is silent, the click still fetches. */
export function prefetchBrowseRows(view: BrowseView, page: number) {
  const target = { ...view, page };
  if (cachedBrowseRows(target)) return;
  void fetchBrowseListings(target)
    .then((data) => rememberBrowseRows(target, data))
    .catch(() => undefined);
}
