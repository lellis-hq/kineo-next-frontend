"use client";

import { useCallback, useMemo } from "react";
import { InlineRetryBanner } from "@/components/molecules/inline-retry-banner";
import { MyListingsView } from "@/components/templates/my-listings-view";
import { readBrowseCache, writeBrowseCache } from "@/lib/browse-cache";
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource";
import { useViewUrl } from "@/lib/hooks/use-view-url";
import {
  fetchMyListings,
  LISTING_FILTERS,
  type ListingsFilter,
  type MyListingsData,
} from "@/lib/listings";
import {
  clampPageSize,
  MY_LISTINGS_PAGE_SIZE_CHOICES,
  type MyListingsPageSize,
  readPageSize,
  rememberPageSize,
} from "@/lib/page-size";

interface View {
  page: number;
  filter: ListingsFilter;
  urgentOnly: boolean;
  pageSize: MyListingsPageSize;
}

const DEFAULT_FILTER: ListingsFilter = "ALL";

/**
 * The urgency toggle and the page size are part of the test: `initialData` is
 * the server's answer without the toggle and at the seeded size.
 */
function isDefaultView(
  view: View,
  seededPageSize: MyListingsPageSize,
): boolean {
  return (
    view.page === 1 &&
    view.filter === DEFAULT_FILTER &&
    !view.urgentOnly &&
    view.pageSize === seededPageSize
  );
}

/** The backend statuses behind a chip; empty means « no filter ». */
function statusesForFilter(filter: ListingsFilter) {
  return LISTING_FILTERS.find((option) => option.id === filter)?.statuses ?? [];
}

function cacheKey(view: View): string {
  return `my-listings:${view.page}:${view.filter}:${view.urgentOnly}:${view.pageSize}`;
}

function loadListings(target: View) {
  return fetchMyListings({
    statuses: statusesForFilter(target.filter),
    page: target.page,
    limit: target.pageSize,
    urgentOnly: target.urgentOnly,
  });
}

/**
 * Orchestrator for /listings/mine. The unfiltered first page arrives from the
 * server; every other view is client state kept in the URL.
 */
export function MyListingsContainer({
  initialData,
  initialPageSize,
}: {
  initialData: MyListingsData;
  initialPageSize: MyListingsPageSize;
}) {
  const readView = useCallback(
    (params: URLSearchParams): View => {
      const filter = params.get("filter") ?? DEFAULT_FILTER;
      const rawSize = params.get("size");
      return {
        page: Math.max(1, Number(params.get("page")) || 1),
        filter: LISTING_FILTERS.some((option) => option.id === filter)
          ? (filter as ListingsFilter)
          : DEFAULT_FILTER,
        urgentOnly: params.get("urgent") === "true",
        pageSize: rawSize
          ? clampPageSize(readPageSize(rawSize), MY_LISTINGS_PAGE_SIZE_CHOICES)
          : initialPageSize,
      };
    },
    [initialPageSize],
  );

  const writeView = useCallback(
    (view: View, params: URLSearchParams) => {
      if (view.page > 1) params.set("page", String(view.page));
      if (view.filter !== DEFAULT_FILTER) params.set("filter", view.filter);
      if (view.urgentOnly) params.set("urgent", "true");
      if (view.pageSize !== initialPageSize) {
        params.set("size", String(view.pageSize));
      }
    },
    [initialPageSize],
  );

  const { view, setView } = useViewUrl({ read: readView, write: writeView });

  const { data, error, loading, reload } = usePaginatedResource<
    MyListingsData,
    View
  >({
    initialData,
    view,
    isDefaultView: (target) => isDefaultView(target, initialPageSize),
    load: loadListings,
    cacheKey: cacheKey(view),
  });

  const prefetch = useCallback(
    (page: number) => {
      const target = { ...view, page };
      const key = cacheKey(target);
      if (readBrowseCache<MyListingsData>(key)) return;
      void loadListings(target)
        .then((fresh) => writeBrowseCache(key, fresh))
        .catch(() => undefined);
    },
    [view],
  );

  /**
   * Safety net: the backend already applies `urgent=true`. If it ever bites,
   * the pager's totals and the rows will disagree.
   */
  const visibleListings = useMemo(
    () =>
      view.urgentOnly
        ? data.listings.filter((listing) => listing.urgent)
        : data.listings,
    [data.listings, view.urgentOnly],
  );

  return (
    <>
      {error !== null && (
        <InlineRetryBanner noun="Les annonces" onRetry={reload} error={error} />
      )}
      <MyListingsView
        listings={visibleListings}
        counts={data.counts}
        currentFilter={view.filter}
        onFilterChange={(next) => setView({ ...view, filter: next, page: 1 })}
        urgentOnly={view.urgentOnly}
        onUrgentToggle={() =>
          setView({ ...view, urgentOnly: !view.urgentOnly, page: 1 })
        }
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={(next) => setView({ ...view, page: next }, "push")}
        onPrefetchPage={prefetch}
        pageSize={view.pageSize}
        onPageSizeChange={(next) => {
          rememberPageSize(next);
          setView({ ...view, pageSize: next, page: 1 });
        }}
        loading={loading}
      />
    </>
  );
}
