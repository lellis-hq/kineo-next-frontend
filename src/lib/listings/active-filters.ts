import { SPECIALTY_LABELS } from "@/lib/profile";
import type { BrowseFormFilters } from "./browse-contracts";

export interface ActiveFilter {
  key: string;
  label: string;
  /** The patch that removes only this filter. */
  clear: Partial<BrowseFormFilters>;
}

/** The filters currently narrowing the feed, in display order. */
export function activeFilters(filters: BrowseFormFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (filters.specialty) {
    chips.push({
      key: "specialty",
      label: SPECIALTY_LABELS[filters.specialty],
      clear: { specialty: "" },
    });
  }
  if (filters.city) {
    chips.push({
      key: "city",
      label: filters.city,
      clear: { city: "", cityCode: "", department: "" },
    });
  } else if (filters.department) {
    chips.push({
      key: "department",
      label: `Département ${filters.department}`,
      clear: { department: "" },
    });
  }
  if (filters.q.trim()) {
    chips.push({
      key: "q",
      label: `« ${filters.q.trim()} »`,
      clear: { q: "" },
    });
  }
  if (filters.from || filters.to) {
    const label = filters.from
      ? filters.to
        ? `Du ${filters.from} au ${filters.to}`
        : `À partir du ${filters.from}`
      : `Jusqu'au ${filters.to}`;
    chips.push({ key: "dates", label, clear: { from: "", to: "" } });
  }
  if (filters.urgentOnly) {
    chips.push({
      key: "urgent",
      label: "Urgentes",
      clear: { urgentOnly: false },
    });
  }
  if (filters.lat && filters.radiusKm) {
    chips.push({
      key: "radius",
      label: `Autour de moi · ${filters.radiusKm} km`,
      clear: { lat: "", lng: "", radiusKm: "" },
    });
  }

  return chips;
}
