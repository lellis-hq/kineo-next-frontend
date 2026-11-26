import { normalizeSearchText } from "./normalize";
import type { GeoSuggestions, SelectedPlace } from "./types";

/** One row of the combobox listbox, in display order. */
export interface PlaceOption {
  id: string;
  label: string;
  detail: string;
  place: SelectedPlace;
}

/**
 * Completion returns names, not codes. Codes are resolved only when a commune
 * is actually picked, keeping one external call per search.
 */
export function buildPlaceOptions(
  suggestions: GeoSuggestions,
  listId: string,
): PlaceOption[] {
  const communes = suggestions.communes.map((commune) => ({
    id: `${listId}-c-${normalizeSearchText(commune.nom)}`,
    label: commune.nom,
    detail: "",
    place: {
      kind: "commune" as const,
      label: commune.nom,
      departmentCode: "",
    },
  }));

  const departments = suggestions.departements.map((department) => ({
    id: `${listId}-d-${department.code}`,
    label: `${department.nom} (${department.code})`,
    detail: "Département",
    place: {
      kind: "departement" as const,
      label: department.nom,
      departmentCode: department.code,
    },
  }));

  return [...communes, ...departments];
}
