import { cacheLife, cacheTag } from "next/cache";
import { normalizeSearchText } from "./normalize";
import type {
  CommuneSuggestion,
  DepartmentSuggestion,
  GeoSuggestions,
} from "./types";

/**
 * The frontend owns place resolution. This is the only place that talks to a
 * public geo API; the Nest backend never calls one and never stores a reference
 * dataset. Codes are resolved here and sent to the backend, which validates
 * and stores them.
 *
 * `'use cache'` is enabled by `cacheComponents` in next.config.ts. One cache
 * entry per normalised query, long-lived because the COG millésime changes
 * yearly, so a keystroke costs one internal request at most.
 */
const GEOPLATEFORME = "https://data.geopf.fr/geocodage";
const ADMINISTRATIVE = "https://geo.api.gouv.fr";
const LIMIT = 6;

interface AddressProperties {
  name?: string;
  city?: string;
  citycode?: string;
  depcode?: string;
  postcode?: string;
  context?: string;
  population?: number;
  [key: string]: unknown;
}

interface AddressFeature {
  properties: AddressProperties;
  geometry?: { coordinates: [number, number] };
}

interface DepartmentRow {
  code: string;
  nom: string;
  codeRegion: string;
}

function departmentCodeFrom(feature: AddressFeature): string {
  const { depcode, context } = feature.properties;
  if (depcode) return depcode.toUpperCase();
  const [code] = (context ?? "").split(",");
  return code?.trim().toUpperCase() ?? "";
}

async function fetchCommunes(query: string): Promise<CommuneSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    type: "municipality",
    limit: String(LIMIT),
  });
  const response = await fetch(`${GEOPLATEFORME}/search?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return [];

  const body = (await response.json()) as { features?: AddressFeature[] };
  return (body.features ?? []).map((feature) => ({
    codeInsee: feature.properties.citycode ?? "",
    nom: feature.properties.city ?? feature.properties.name ?? "",
    codeDepartement: departmentCodeFrom(feature),
    codePostal: feature.properties.postcode ?? null,
    latitude: feature.geometry?.coordinates[1] ?? null,
    longitude: feature.geometry?.coordinates[0] ?? null,
  }));
}

async function fetchDepartements(
  query: string,
): Promise<DepartmentSuggestion[]> {
  const params = new URLSearchParams({
    nom: query,
    fields: "nom,code,codeRegion",
    limit: String(LIMIT),
  });
  const response = await fetch(`${ADMINISTRATIVE}/departements?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return [];

  return (await response.json()) as DepartmentRow[];
}

export async function searchPlaces(query: string): Promise<GeoSuggestions> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86_400, expire: 604_800 });
  cacheTag("geo-reference");

  const normalized = normalizeSearchText(query);
  if (normalized.length < 2) return { communes: [], departements: [] };

  // One of the two APIs failing must not hide the other half of the list.
  const [communes, departements] = await Promise.all([
    fetchCommunes(normalized).catch(() => []),
    fetchDepartements(normalized).catch(() => []),
  ]);

  return { communes, departements };
}
