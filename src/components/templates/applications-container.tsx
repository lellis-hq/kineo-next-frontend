"use client";

import { useCallback } from "react";
import { InlineRetryBanner } from "@/components/molecules/inline-retry-banner";
import { ApplicationsView } from "@/components/templates/applications-view";
import {
  APPLICATION_FILTERS,
  type ApplicationsData,
  type ApplicationsFilter,
  fetchApplicationsData,
  REJECTION_SITUATIONS,
  type RejectionSituationFilter,
} from "@/lib/applications";
import { readBrowseCache, writeBrowseCache } from "@/lib/browse-cache";
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource";
import { useViewUrl } from "@/lib/hooks/use-view-url";
import {
  APPLICATIONS_PAGE_SIZE_CHOICES,
  type ApplicationsPageSize,
  clampPageSize,
  readPageSize,
  rememberPageSize,
} from "@/lib/page-size";
import type { ApplicationRejectionBucket } from "@/lib/types/api";

interface View {
  page: number;
  filter: ApplicationsFilter;
  /** Which situation, within « Refusées » only. */
  situation: RejectionSituationFilter;
  pageSize: ApplicationsPageSize;
}

const DEFAULT_FILTER: ApplicationsFilter = "ALL";
const DEFAULT_SITUATION: RejectionSituationFilter = "ALL";

function isDefaultView(
  view: View,
  seededPageSize: ApplicationsPageSize,
): boolean {
  return (
    view.page === 1 &&
    view.filter === DEFAULT_FILTER &&
    view.situation === DEFAULT_SITUATION &&
    view.pageSize === seededPageSize
  );
}

function cacheKey(view: View): string {
  return `applications:${view.page}:${view.filter}:${view.situation}:${view.pageSize}`;
}

function bucketParams(filter: ApplicationsFilter) {
  const bucket = APPLICATION_FILTERS.find((option) => option.id === filter);
  return { status: bucket?.status };
}

/**
 * Orchestrator for /applications. The first page of « Toutes » arrives from
 * the server; every other view is client state kept in the URL without a
 * server navigation.
 */
export function ApplicationsContainer({
  initialData,
  initialPageSize,
}: {
  initialData: ApplicationsData;
  initialPageSize: ApplicationsPageSize;
}) {
  const readView = useCallback(
    (params: URLSearchParams): View => {
      const filter = params.get("filter") ?? DEFAULT_FILTER;
      const situation = params.get("situation") ?? DEFAULT_SITUATION;
      const rawSize = params.get("size");
      return {
        page: Math.max(1, Number(params.get("page")) || 1),
        filter: APPLICATION_FILTERS.some((option) => option.id === filter)
          ? (filter as ApplicationsFilter)
          : DEFAULT_FILTER,
        situation: REJECTION_SITUATIONS.some(
          (option) => option.id === situation,
        )
          ? (situation as RejectionSituationFilter)
          : DEFAULT_SITUATION,
        pageSize: rawSize
          ? clampPageSize(readPageSize(rawSize), APPLICATIONS_PAGE_SIZE_CHOICES)
          : initialPageSize,
      };
    },
    [initialPageSize],
  );

  const writeView = useCallback(
    (view: View, params: URLSearchParams) => {
      if (view.page > 1) params.set("page", String(view.page));
      if (view.filter !== DEFAULT_FILTER) params.set("filter", view.filter);
      if (view.situation !== DEFAULT_SITUATION) {
        params.set("situation", view.situation);
      }
      if (view.pageSize !== initialPageSize) {
        params.set("size", String(view.pageSize));
      }
    },
    [initialPageSize],
  );

  const { view, setView } = useViewUrl({ read: readView, write: writeView });

  const load = useCallback(
    (target: View) =>
      fetchApplicationsData({
        page: target.page,
        limit: target.pageSize,
        ...bucketParams(target.filter),
        ...(target.situation === DEFAULT_SITUATION
          ? {}
          : { bucket: target.situation as ApplicationRejectionBucket }),
      }),
    [],
  );

  const { data, error, loading, reload } = usePaginatedResource<
    ApplicationsData,
    View
  >({
    initialData,
    view,
    isDefaultView: (target) => isDefaultView(target, initialPageSize),
    load,
    cacheKey: cacheKey(view),
  });

  const prefetch = useCallback(
    (page: number) => {
      const target = { ...view, page };
      const key = cacheKey(target);
      if (readBrowseCache<ApplicationsData>(key)) return;
      void fetchApplicationsData({
        page,
        limit: target.pageSize,
        ...bucketParams(target.filter),
        ...(target.situation === DEFAULT_SITUATION
          ? {}
          : { bucket: target.situation as ApplicationRejectionBucket }),
      })
        .then((fresh) => writeBrowseCache(key, fresh))
        .catch(() => undefined);
    },
    [view],
  );

  return (
    <div>
      {error !== null && (
        <InlineRetryBanner
          noun="Les candidatures"
          onRetry={reload}
          error={error}
        />
      )}
      <ApplicationsView
        data={data}
        onPageChange={(next) => setView({ ...view, page: next }, "push")}
        onPrefetchPage={prefetch}
        onFilterChange={(next) =>
          setView({
            ...view,
            filter: next,
            situation: next !== "REFUSED" ? DEFAULT_SITUATION : view.situation,
            page: 1,
          })
        }
        currentFilter={view.filter}
        currentSituation={view.situation}
        onSituationChange={(next) =>
          setView({ ...view, situation: next, page: 1 })
        }
        pageSize={view.pageSize}
        onPageSizeChange={(next) => {
          rememberPageSize(next);
          setView({ ...view, pageSize: next, page: 1 });
        }}
        loading={loading}
      />
    </div>
  );
}
