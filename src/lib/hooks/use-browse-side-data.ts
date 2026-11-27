"use client";

import { useEffect, useRef, useState } from "react";
import { readBrowseCache, writeBrowseCache } from "@/lib/browse-cache";
import type {
  BrowseFacets,
  BrowsePlacesData,
  BrowseView,
} from "@/lib/listings";
import { fetchBrowsePlaces, fetchFacets } from "@/lib/listings";
import { browseQuery } from "@/lib/listings/browse-service";
import { useLatest } from "./use-latest";
import { useRaceGuard } from "./use-race-guard";

/**
 * Facets and places answer the *filters*, not the page or the sort. Their key
 * omits both, so turning a page never refetches either one — unlike the old
 * server-seeded page, which re-read all three on every navigation.
 */
export function useBrowseFacets(initial: BrowseFacets, view: BrowseView) {
  const key = browseQuery(view, { specialty: undefined });
  const [facets, setFacets] = useState(initial);
  const [loading, setLoading] = useState(false);
  const guard = useRaceGuard();
  const viewRef = useLatest(view);
  const seededKey = useRef(key);

  useEffect(() => {
    guard.revoke();
    const cached = readBrowseCache<BrowseFacets>(`facets:${key}`);
    if (cached !== undefined) {
      setFacets(cached);
      setLoading(false);
      return;
    }
    if (key === seededKey.current) {
      setFacets(initial);
      setLoading(false);
      return;
    }

    const { controller, mine } = guard.start();
    setLoading(true);
    fetchFacets(viewRef.current, undefined, { signal: controller.signal })
      .then((loaded) => {
        if (guard.isStale(mine)) return;
        guard.settled();
        writeBrowseCache(`facets:${key}`, loaded);
        setFacets(loaded);
        setLoading(false);
      })
      .catch(() => {
        if (guard.isStale(mine)) return;
        guard.settled();
        // Keep the previous counts: a failed summary is not an empty one.
        setLoading(false);
      });

    return () => guard.cancel();
  }, [key, initial, guard]);

  return { facets, loading };
}

export function useBrowsePlaces(
  initial: BrowsePlacesData | null,
  view: BrowseView,
  enabled = true,
) {
  const key = browseQuery(view);
  const [places, setPlaces] = useState(initial);
  const [loading, setLoading] = useState(false);
  const guard = useRaceGuard();
  const viewRef = useLatest(view);
  const seededKey = useRef(key);

  useEffect(() => {
    guard.revoke();
    if (!enabled) {
      setLoading(false);
      return;
    }
    const cached = readBrowseCache<BrowsePlacesData>(`places:${key}`);
    if (cached !== undefined) {
      setPlaces(cached);
      setLoading(false);
      return;
    }
    // A list-only first render has no seeded places: fetch them when the map
    // appears, even though the filter key itself has not changed.
    if (key === seededKey.current && initial !== null) {
      setPlaces(initial);
      setLoading(false);
      return;
    }

    const { controller, mine } = guard.start();
    setLoading(true);
    fetchBrowsePlaces(viewRef.current, undefined, { signal: controller.signal })
      .then((loaded) => {
        if (guard.isStale(mine)) return;
        guard.settled();
        if (loaded !== null) {
          writeBrowseCache(`places:${key}`, loaded);
          setPlaces(loaded);
        }
        setLoading(false);
      })
      .catch(() => {
        if (guard.isStale(mine)) return;
        guard.settled();
        setLoading(false);
      });

    return () => guard.cancel();
  }, [key, initial, enabled, guard]);

  return { places, loading };
}
