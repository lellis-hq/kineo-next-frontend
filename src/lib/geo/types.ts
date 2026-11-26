/** A commune as the combobox offers it; the codes are what get committed. */
export interface CommuneSuggestion {
  codeInsee: string;
  nom: string;
  codeDepartement: string;
  codePostal: string | null;
  latitude: number | null;
  longitude: number | null;
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
