"use client";

import { useCallback } from "react";
import type { SelectedPlace } from "@/lib/geo/types";
import type { BrowseFormFilters } from "@/lib/listings";

/**
 * The location filter's two ways of being committed: a picked place carries
 * stable codes, free text keeps the legacy substring filter, and geolocation
 * commits a centre with its radius.
 */
export function useLocationFilters(
  filters: BrowseFormFilters,
  onFiltersChange: (patch: Partial<BrowseFormFilters>) => void,
) {
  const commitCity = useCallback(
    (place: SelectedPlace | null, text: string) => {
      if (place) {
        onFiltersChange({
          city: place.label,
          cityCode: place.cityCodeInsee ?? "",
          department: place.departmentCode,
          lat: place.latitude !== undefined ? String(place.latitude) : "",
          lng: place.longitude !== undefined ? String(place.longitude) : "",
          radiusKm: "",
        });
        return;
      }
      onFiltersChange({
        city: text,
        cityCode: "",
        department: "",
        lat: "",
        lng: "",
        radiusKm: "",
      });
    },
    [onFiltersChange],
  );

  const clearLocation = useCallback(
    () => onFiltersChange({ lat: "", lng: "", radiusKm: "" }),
    [onFiltersChange],
  );

  const locate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) =>
        onFiltersChange({
          city: "",
          cityCode: "",
          department: "",
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
          radiusKm: filters.radiusKm || "10",
        }),
      () => undefined,
    );
  }, [filters.radiusKm, onFiltersChange]);

  return { commitCity, locate, clearLocation };
}
