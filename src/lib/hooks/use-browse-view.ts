"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useLatest } from "@/lib/hooks/use-latest";
import {
  type BrowseFormFilters,
  type BrowseLayout,
  type BrowseSort,
  browseViewFromParams,
  browseViewToParams,
  EMPTY_BROWSE_FILTERS,
  horizonForBounds,
  isDefaultBrowseView,
  readLayout,
  toBrowseView,
} from "@/lib/listings";
import { SPECIALTY_LABELS } from "@/lib/profile";
import type { Specialty } from "@/lib/types/api";

/**
 * The browse screen's view, read from and written to the URL — unlike the
 * console screens, so a filtered search can be shared and walked back through.
 * The layout stays client state: a visual reflow isn't worth a round trip.
 */
export function useBrowseView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();

  const paramsKey = searchParams.toString();
  const { filters, page, sort } = useMemo(
    () => browseViewFromParams(new URLSearchParams(paramsKey)),
    [paramsKey],
  );

  // The layout lives in the URL so a shared link opens the same split/map/list
  // view. Local state keeps the switch responsive during the transition.
  const [layout, setLayoutState] = useState<BrowseLayout>(() =>
    readLayout(new URLSearchParams(paramsKey).get("view")),
  );
  // Read synchronously by writeView: a pick can change the layout and turn the
  // page in the same tick, and both URL writes must carry the new layout.
  const layoutRef = useLatest(layout);
  const [pendingWrite, setPendingWrite] = useState<"filters" | "page" | null>(
    null,
  );

  useEffect(() => {
    if (!isNavigating) setPendingWrite(null);
  }, [isNavigating]);

  useEffect(() => {
    if (!isNavigating) {
      setLayoutState(readLayout(new URLSearchParams(paramsKey).get("view")));
    }
  }, [paramsKey, isNavigating]);

  const view = useMemo(
    () => toBrowseView(filters, page, sort),
    [filters, page, sort],
  );

  /**
   * `method` is the history policy: `replace` for filters and sort, `push` for
   * the pager. `kind` feeds the rail's busy state — a page turn made on the
   * reader's behalf is a `replace` and still a page.
   */
  const writeView = useCallback(
    (
      next: { filters: BrowseFormFilters; page: number; sort: BrowseSort },
      method: "replace" | "push",
      kind: "filters" | "page",
      /** Carried explicitly by a pick that reveals the list. */
      layoutOverride?: BrowseLayout,
    ) => {
      const query = browseViewToParams(
        next.filters,
        next.page,
        next.sort,
        layoutOverride ?? layoutRef.current,
      );
      const search = query.toString();
      const url = search ? `${pathname}?${search}` : pathname;
      setPendingWrite(kind);
      startTransition(() => {
        if (method === "push") router.push(url);
        else router.replace(url);
      });
    },
    [pathname, router],
  );

  /** A visual reflow: optimistic locally, but still shared through the URL. */
  const setLayout = useCallback(
    (next: BrowseLayout) => {
      layoutRef.current = next;
      setLayoutState(next);
      const query = browseViewToParams(filters, page, sort, next).toString();
      const url = query ? `${pathname}?${query}` : pathname;
      startTransition(() => router.replace(url));
    },
    [filters, page, sort, pathname, router],
  );

  /**
   * Optimistic part of a pick: the caller owns the single URL write (the page
   * turn) and passes the new layout explicitly to `writeView`.
   */
  const revealSplit = useCallback(() => {
    layoutRef.current = "split";
    setLayoutState("split");
  }, []);

  /** A filter change returns to the first page, in the same URL write. */
  const applyFilters = useCallback(
    (patch: Partial<BrowseFormFilters>) => {
      writeView(
        { filters: { ...filters, ...patch }, page: 1, sort },
        "replace",
        "filters",
      );
    },
    [filters, sort, writeView],
  );

  const applySort = useCallback(
    (next: BrowseSort) => {
      writeView({ filters, page: 1, sort: next }, "replace", "filters");
    },
    [filters, writeView],
  );

  const resetFilters = useCallback(() => {
    writeView(
      { filters: EMPTY_BROWSE_FILTERS, page: 1, sort },
      "replace",
      "filters",
    );
  }, [sort, writeView]);

  /** A `push`, so the back button walks the pages. */
  const changePage = useCallback(
    (next: number) => {
      writeView({ filters, page: next, sort }, "push", "page");
    },
    [filters, sort, writeView],
  );

  // Derived from the date fields rather than stored, so the two can't disagree.
  const horizon = horizonForBounds(
    filters.from || undefined,
    filters.to || undefined,
  );

  const specialties = useMemo(
    () =>
      (Object.keys(SPECIALTY_LABELS) as Specialty[]).map((id) => ({
        id,
        label: SPECIALTY_LABELS[id],
      })),
    [],
  );

  return {
    filters,
    page,
    sort,
    view,
    layout,
    setLayout,
    revealSplit,
    isNavigating,
    pendingWrite,
    writeView,
    applyFilters,
    applySort,
    resetFilters,
    changePage,
    horizon,
    specialties,
    filtered: !isDefaultBrowseView(view),
  };
}
