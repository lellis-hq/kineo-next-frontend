"use client";

import { useCallback, useState } from "react";
import { ListingDetailView } from "@/components/templates/listing-detail-view";
import { ApiError } from "@/lib/api-client";
import { errorMessage } from "@/lib/api-errors";
import { readBrowseCache, writeBrowseCache } from "@/lib/browse-cache";
import { useListingAction } from "@/lib/hooks/use-listing-action";
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource";
import { useViewUrl } from "@/lib/hooks/use-view-url";
import {
  ACTION_SUCCESS,
  acceptReceivedApplication,
  fetchListingApplications,
  fetchMyListing,
  LISTING_APPLICATIONS_PAGE_SIZE,
  type ListingApplicationsData,
  listingReadErrorMessage,
  type MyListing,
  markApplicationViewed,
  RECEIVED_FILTERS,
  type ReceivedApplicationsFilter,
  rejectReceivedApplication,
  shortlistReceivedApplication,
} from "@/lib/listings";
import type { ApiStoredFile, ApplicationStatus } from "@/lib/types/api";

interface View {
  page: number;
  filter: ReceivedApplicationsFilter;
}

const DEFAULT_FILTER: ReceivedApplicationsFilter = "ALL";

function isDefaultView(view: View): boolean {
  return view.page === 1 && view.filter === DEFAULT_FILTER;
}

/** The backend status behind a candidate chip; undefined means « no filter ». */
function statusForFilter(
  filter: ReceivedApplicationsFilter,
): ApplicationStatus | undefined {
  return RECEIVED_FILTERS.find((option) => option.id === filter)?.status;
}

function cacheKey(listingId: string, view: View): string {
  return `received:${listingId}:${view.page}:${view.filter}`;
}

/**
 * Orchestrator for /listings/mine/[id]. The listing and the first page of
 * candidates arrive from the server; filtering, paging and re-reads are client
 * state kept in the URL.
 */
export function ListingDetailContainer({
  listingId,
  initialListing,
  initialReceived,
  initialPhotos,
}: {
  listingId: string;
  initialListing: MyListing;
  initialReceived: ListingApplicationsData;
  initialPhotos: ApiStoredFile[];
}) {
  const [listing, setListing] = useState<MyListing>(initialListing);

  const readView = useCallback((params: URLSearchParams): View => {
    const filter = params.get("filter") ?? DEFAULT_FILTER;
    return {
      page: Math.max(1, Number(params.get("page")) || 1),
      filter: RECEIVED_FILTERS.some((option) => option.id === filter)
        ? (filter as ReceivedApplicationsFilter)
        : DEFAULT_FILTER,
    };
  }, []);

  const writeView = useCallback((view: View, params: URLSearchParams) => {
    if (view.page > 1) params.set("page", String(view.page));
    if (view.filter !== DEFAULT_FILTER) params.set("filter", view.filter);
  }, []);

  const { view, setView } = useViewUrl({ read: readView, write: writeView });

  const load = useCallback(
    (target: View) =>
      fetchListingApplications(listingId, {
        status: statusForFilter(target.filter),
        page: target.page,
        limit: LISTING_APPLICATIONS_PAGE_SIZE,
      }),
    [listingId],
  );

  const {
    data: received,
    error,
    loading,
    replace,
  } = usePaginatedResource<ListingApplicationsData, View>({
    initialData: initialReceived,
    view,
    isDefaultView,
    load,
    cacheKey: cacheKey(listingId, view),
  });

  const prefetch = useCallback(
    (page: number) => {
      const target = { ...view, page };
      const key = cacheKey(listingId, target);
      if (readBrowseCache<ListingApplicationsData>(key)) return;
      void fetchListingApplications(listingId, {
        status: statusForFilter(target.filter),
        page,
        limit: LISTING_APPLICATIONS_PAGE_SIZE,
      })
        .then((fresh) => writeBrowseCache(key, fresh))
        .catch(() => undefined);
    },
    [listingId, view],
  );

  /**
   * Both halves are re-read rather than patched: the actions change statuses
   * server-side. The current filter and page are kept.
   */
  const reread = useCallback(async () => {
    const [freshListing, freshReceived] = await Promise.all([
      fetchMyListing(listingId),
      load(view),
    ]);
    return { freshListing, freshReceived };
  }, [listingId, load, view]);

  const adopt = useCallback(
    ({ freshListing, freshReceived }: Awaited<ReturnType<typeof reread>>) => {
      setListing(freshListing);
      replace(freshReceived);
    },
    [replace],
  );

  const action = useListingAction({ refresh: reread, onSettled: adopt });

  /** After a decision, re-read like the listing actions do. */
  const refreshAfterDecision = useCallback(
    async () => adopt(await reread()),
    [adopt, reread],
  );

  const onApplicationViewed = useCallback(
    (applicationId: string) =>
      markApplicationViewed(applicationId).then(refreshAfterDecision),
    [refreshAfterDecision],
  );
  const onApplicationShortlist = useCallback(
    (applicationId: string) =>
      shortlistReceivedApplication(applicationId).then(refreshAfterDecision),
    [refreshAfterDecision],
  );
  const onApplicationAccept = useCallback(
    (applicationId: string) =>
      acceptReceivedApplication(applicationId).then(refreshAfterDecision),
    [refreshAfterDecision],
  );
  const onApplicationReject = useCallback(
    (applicationId: string, reason: string | undefined) =>
      rejectReceivedApplication(applicationId, reason).then(
        refreshAfterDecision,
      ),
    [refreshAfterDecision],
  );

  const readError =
    error === null
      ? undefined
      : error instanceof ApiError
        ? listingReadErrorMessage(error)
        : errorMessage(error);

  return (
    <ListingDetailView
      listing={listing}
      photos={initialPhotos}
      received={received}
      receivedFilter={view.filter}
      onReceivedFilterChange={(next) => {
        setView({ ...view, filter: next, page: 1 });
        action.reset();
      }}
      onPageChange={(next) => setView({ ...view, page: next }, "push")}
      onPrefetchPage={prefetch}
      loading={loading}
      acting={action.actingId === listingId}
      error={action.error?.message ?? readError}
      feedback={action.feedback?.message}
      onClose={() => action.run(listingId, "close", ACTION_SUCCESS.close)}
      onCancel={() => action.run(listingId, "cancel", ACTION_SUCCESS.cancel)}
      onApplicationViewed={onApplicationViewed}
      onApplicationShortlist={onApplicationShortlist}
      onApplicationAccept={onApplicationAccept}
      onApplicationReject={onApplicationReject}
    />
  );
}
