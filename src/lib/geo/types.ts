/**
 * A commune as the completion API offers it. The codes are resolved only when
 * the reader picks it, which keeps one external call per search instead of two.
 */
export interface CommuneSuggestion {
  nom: string;
  codeInsee?: string;
  codeDepartement?: string;
  codePostal?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DepartmentSuggestion {
  code: string;
  nom: string;
  codeRegion: string;
}

export interface GeoSuggestions {
  communes: CommuneSuggestion[];
  departements: DepartmentSuggestion[];
}

/** What a selected suggestion sends to the API on write, and to the URL on read. */
export interface SelectedPlace {
  kind: "commune" | "departement";
  /** Display label, kept as the human-readable `city` field. */
  label: string;
  cityCodeInsee?: string;
  departmentCode: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}
