import { cacheLife, cacheTag } from "next/cache";
import { fetchGeoJson } from "./fetch";
import { filterDepartements } from "./filter";
import { normalizeSearchText } from "./normalize";
import type {
  CommuneSuggestion,
  DepartmentSuggestion,
  GeoSuggestions,
  SelectedPlace,
} from "./types";

/**
 * The frontend owns place resolution: this module is the only one that talks
 * to a public geo API. The Nest backend never calls one and never stores a
 * reference dataset; it only validates and stores the codes resolved here.
 *
 * All caching is confined to this file. Docker self-hosting uses `'use cache'`
 * (persistent in-memory); switching to Vercel is a one-line change to
 * `'use cache: remote'` on each cached function below.
 */
const GEOPLATEFORME = "https://data.geopf.fr/geocodage";
const ADMINISTRATIVE = "https://geo.api.gouv.fr";
const LIMIT = 6;

interface CompletionResult {
  names?: string[];
  city?: string;
  fulltext?: string;
  kind?: string;
  poiType?: string[];
}

interface CompletionResponse {
  results?: CompletionResult[];
}

interface AddressProperties {
  name?: string;
  city?: string;
  citycode?: string;
  depcode?: string;
  postcode?: string;
  context?: string;
}

interface AddressFeature {
  properties: AddressProperties;
  geometry?: { coordinates: [number, number] };
}

interface AddressResponse {
  features?: AddressFeature[];
}

interface DepartmentRow {
  code: string;
  nom: string;
  codeRegion: string;
}

/** The 101 departments, fetched once per deployment rather than per query. */
export async function getDepartements(): Promise<DepartmentSuggestion[]> {
  "use cache";
  cacheLife("max");
  cacheTag("geo-departements");

  const params = new URLSearchParams({
    fields: "nom,code,codeRegion",
  });
  return fetchGeoJson<DepartmentRow[]>(
    `${ADMINISTRATIVE}/departements?${params}`,
  );
}

/** One completion call for communes; departments come from the cached list. */
export async function searchCommunes(
  query: string,
): Promise<CommuneSuggestion[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86_400, expire: 604_800 });
  cacheTag("geo-communes");

  const params = new URLSearchParams({
    text: query,
    maximumResponses: String(LIMIT),
  });
  const body = await fetchGeoJson<CompletionResponse>(
    `${GEOPLATEFORME}/completion/?${params}`,
  );

  const seen = new Set<string>();
  return (body.results ?? [])
    .filter(
      (result) =>
        result.poiType?.includes("commune") || result.kind === "municipality",
    )
    .map((result) => result.names?.[0] ?? result.city ?? result.fulltext ?? "")
    .filter((nom) => {
      if (!nom || seen.has(nom)) return false;
      seen.add(nom);
      return true;
    })
    .slice(0, LIMIT)
    .map((nom) => ({ nom }));
}

/** Resolve the stable codes when a commune is actually chosen. */
export async function resolveCommune(query: string): Promise<SelectedPlace> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86_400, expire: 604_800 });
  cacheTag("geo-resolve");

  const params = new URLSearchParams({
    q: query,
    type: "municipality",
    limit: "1",
  });
  const body = await fetchGeoJson<AddressResponse>(
    `${GEOPLATEFORME}/search?${params}`,
  );
  const feature = body.features?.[0];
  if (!feature) throw new Error("Commune introuvable");

  const { citycode, city, name, depcode, postcode, context } =
    feature.properties;
  const [contextCode] = (context ?? "").split(",");

  return {
    kind: "commune",
    label: city ?? name ?? query,
    cityCodeInsee: citycode,
    departmentCode: (depcode ?? contextCode ?? "").trim().toUpperCase(),
    postalCode: postcode,
    latitude: feature.geometry?.coordinates[1],
    longitude: feature.geometry?.coordinates[0],
  };
}

/** Compose the two cached sources; no external call happens here directly. */
export async function searchPlaces(query: string): Promise<GeoSuggestions> {
  const normalized = normalizeSearchText(query);
  if (normalized.length < 2) return { communes: [], departements: [] };

  const [communes, departements] = await Promise.all([
    searchCommunes(normalized),
    getDepartements(),
  ]);

  return {
    communes,
    departements: filterDepartements(departements, normalized, LIMIT),
  };
}
