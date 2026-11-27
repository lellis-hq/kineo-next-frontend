"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ListingsView } from "@/components/templates/listings-view";
import { useBrowsePicking } from "@/lib/hooks/use-browse-picking";
import { useBrowseResource } from "@/lib/hooks/use-browse-resource";
import {
  useBrowseFacets,
  useBrowsePlaces,
} from "@/lib/hooks/use-browse-side-data";
import { useBrowseView } from "@/lib/hooks/use-browse-view";
import {
  BROWSE_PAGE_SIZE,
  type BrowseFacets,
  type BrowseFormFilters,
  type BrowseHorizon,
  type BrowseListingsData,
  type BrowsePlacesData,
  type BrowseSort,
  horizonBounds,
  narrowsCollection,
  pagePoints,
} from "@/lib/listings";
import { prefetchBrowseRows } from "@/lib/listings/browse-cache";
import type { MapPoint } from "@/lib/map/types";

/** The map, browser-only: MapLibre needs WebGL and `window` on import. */
const ListingsMap = dynamic(
  () =>
    import("@/components/organisms/listings-map").then((m) => m.ListingsMap),
  {
    ssr: false,
    loading: () => (
      <div className="size-full rounded-card bg-map-base" aria-hidden="true" />
    ),
  },
);

/**
 * The browse screen's composition root: `useBrowseView` owns the URL (written
 * with the native History API), while rows, facets and places are fetched on
 * the client when the view changes. The server payload only seeds the first
 * render, so a filter change is one request instead of a full page navigation.
 */
export function ListingsContainer({
  initialData,
  initialFacets,
  initialPlaces,
  homeCoordinates,
}: {
  initialData: BrowseListingsData;
  initialFacets: BrowseFacets;
  initialPlaces: BrowsePlacesData | null;
  /** The member's geocoded city, where the map opens; null without one. */
  homeCoordinates: MapPoint | null;
}) {
  const browse = useBrowseView();
  const resource = useBrowseResource(initialData, browse.view);
  const facets = useBrowseFacets(initialFacets, browse.view);
  const places = useBrowsePlaces(
    initialPlaces,
    browse.view,
    browse.layout !== "list",
  );
  const router = useRouter();
  const picking = useBrowsePicking({
    view: browse.view,
    filters: browse.filters,
    sort: browse.sort,
    writeView: browse.writeView,
    layout: browse.layout,
    setLayout: browse.setLayout,
    revealSplit: browse.revealSplit,
    data: resource.data,
    onScreenIds: resource.onScreenIds,
    scrollTo: resource.scrollTo,
    clearScroll: resource.clearScroll,
    tableRef: resource.tableRef,
    mapRef: resource.mapRef,
  });

  /** A view change that narrows or reorders the collection drops the choice. */
  const dropChoice = useCallback(() => {
    picking.setHoveredListingId(null);
    picking.clearSelection();
  }, [picking.clearSelection, picking.setHoveredListingId]);

  const onFiltersChange = useCallback(
    (patch: Partial<BrowseFormFilters>) => {
      dropChoice();
      browse.applyFilters(patch);
    },
    [browse.applyFilters, dropChoice],
  );

  const onSortChange = useCallback(
    (next: BrowseSort) => {
      dropChoice();
      browse.applySort(next);
    },
    [browse.applySort, dropChoice],
  );

  const onResetFilters = useCallback(() => {
    dropChoice();
    browse.resetFilters();
  }, [browse.resetFilters, dropChoice]);

  /** A page turn drops only the transient pick; the choice stays. */
  const onPageChange = useCallback(
    (next: number) => {
      picking.clearTransientPick();
      browse.changePage(next);
    },
    [browse.changePage, picking.clearTransientPick],
  );

  const busy = facets.loading || places.loading;

  return (
    <ListingsView
      rail={{
        facets: facets.facets,
        filters: browse.filters,
        onFiltersChange,
        selection: picking.selection,
        onSelectionReveal: picking.revealSelection,
        onSelectionClear: picking.clearSelection,
        busy,
      }}
      toolbar={{
        filters: browse.filters,
        onFiltersChange,
        specialties: browse.specialties,
        filtered: browse.filtered,
        onResetFilters,
        total: resource.data.total,
        sort: browse.sort,
        onSortChange,
        layout: browse.layout,
        onLayoutChange: browse.setLayout,
      }}
      layout={browse.layout}
      results={{
        listings: resource.data.listings,
        total: resource.data.total,
        totalPages: resource.data.totalPages,
        page: resource.data.page,
        onPageChange,
        onPrefetchPage: (next) => prefetchBrowseRows(browse.view, next),
        pageSize: browse.view.limit ?? BROWSE_PAGE_SIZE,
        onPageSizeChange: (size) => onFiltersChange({ limit: String(size) }),
        filters: browse.filters,
        onFiltersChange,
        loading: resource.loading,
        filtered: browse.filtered,
        horizon: browse.horizon,
        onHorizonChange: (next: BrowseHorizon) =>
          onFiltersChange(horizonBounds(next)),
        onHoveredChange: picking.setHoveredListingId,
        selectedListingId: picking.selectedListing?.id ?? null,
        onListingSelect: picking.selectListing,
        spotlight: picking.spotlight,
        announcement: picking.announcement,
        pageHighlight:
          picking.spotlight && resource.data.page !== picking.spotlight.fromPage
            ? picking.spotlight.nonce
            : null,
        onResetFilters,
        tableRef: resource.tableRef,
      }}
      map={
        <ListingsMap
          ref={resource.mapRef}
          places={places.places?.places ?? []}
          unlocated={places.places?.unlocated ?? 0}
          totalPlaces={places.places?.totalPlaces ?? 0}
          truncated={places.places?.truncated ?? false}
          homeCoordinates={homeCoordinates}
          // Unfiltered, the map stays on the member's region; a filter frames
          // what it kept.
          autoFrame={narrowsCollection(browse.view)}
          pagePoints={pagePoints(resource.data.listings)}
          hoveredListingId={picking.hoveredListingId}
          onHoveredChange={picking.setHoveredListingId}
          selectedListing={picking.selectedListing}
          onSelectionClear={picking.clearSelection}
          onMarkerSelect={picking.pickListing}
          onListingPick={picking.pickListing}
          onListingOpen={(listing) => router.push(`/listings/${listing.id}`)}
        />
      }
    />
  );
}
