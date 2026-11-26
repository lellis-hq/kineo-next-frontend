/**
 * The browse feed's view as it round-trips through the URL. The reader takes
 * a `URLSearchParams`-shaped source, so the server's `searchParams` and the
 * client's `useSearchParams()` both fit.
 */

import { toIsoDayBound } from "@/lib/format";
import { SPECIALTY_LABELS } from "@/lib/profile";
import type { Specialty } from "@/lib/types/api";
import type {
  BrowseFormFilters,
  BrowseSort,
  BrowseView,
} from "./browse-contracts";

/** The view the server renders on arrival: no filter, first page, newest first. */
export const DEFAULT_BROWSE_VIEW = { page: 1, sort: "recent" } as const;

const CITY_CODE = /^(?:\d{5}|2[AB]\d{3})$/i;
const DEPARTMENT_CODE = /^(?:\d{2}|2[AB]|97\d)$/i;

/** A radius is one filter: a lone coordinate would change its meaning. */
function readCentre(
  latRaw: string | null,
  lngRaw: string | null,
  radiusRaw: string | null,
): { lat?: number; lng?: number; radiusKm?: number } {
  const lat = Number(latRaw ?? "");
  const lng = Number(lngRaw ?? "");
  const radiusKm = Number(radiusRaw ?? "");
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !Number.isFinite(radiusKm) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180 ||
    radiusKm <= 0 ||
    radiusKm > 500
  ) {
    return {};
  }
  return { lat, lng, radiusKm };
}

/**
 * The form's filters as a view of the feed. Empty values become `undefined`
 * (the endpoint rejects `city=""`), and the upper date bound lands on the last
 * millisecond of its day.
 */
export function toBrowseView(
  filters: BrowseFormFilters,
  page = 1,
  sort: BrowseSort = DEFAULT_BROWSE_VIEW.sort,
): BrowseView {
  return {
    page,
    sort,
    specialty: filters.specialty || undefined,
    city: filters.city.trim() || undefined,
    cityCode: CITY_CODE.test(filters.cityCode.trim())
      ? filters.cityCode.trim().toUpperCase()
      : undefined,
    department: DEPARTMENT_CODE.test(filters.department.trim())
      ? filters.department.trim().toUpperCase()
      : undefined,
    ...readCentre(filters.lat, filters.lng, filters.radiusKm),
    q: filters.q.trim() || undefined,
    urgentOnly: filters.urgentOnly || undefined,
    startDateFrom: toIsoDayBound(filters.from),
    startDateTo: toIsoDayBound(filters.to, true),
  };
}

/** True when a view is the one the server already answered for. */
export function isDefaultBrowseView(view: BrowseView): boolean {
  return (
    view.page === DEFAULT_BROWSE_VIEW.page &&
    view.sort === DEFAULT_BROWSE_VIEW.sort &&
    !narrowsCollection(view)
  );
}

/**
 * Whether the view keeps only part of the postings — a filter, not a page or
 * an order. What the map's framing follows: only a narrower set moves it.
 */
export function narrowsCollection(view: BrowseView): boolean {
  return (
    view.specialty !== undefined ||
    view.city !== undefined ||
    view.cityCode !== undefined ||
    view.department !== undefined ||
    view.lat !== undefined ||
    view.q !== undefined ||
    view.startDateFrom !== undefined ||
    view.startDateTo !== undefined ||
    view.urgentOnly === true
  );
}

/**
 * The sort values the URL may carry. An old `sort=urgent` link is read as the
 * `urgent=true` filter instead (see `browseViewFromParams`).
 */
const BROWSE_SORT_IDS: readonly BrowseSort[] = ["recent", "startDate"];

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function readSpecialty(raw: string): Specialty | "" {
  // `hasOwn`, not `in`: a prototype key is not a specialty.
  return Object.hasOwn(SPECIALTY_LABELS, raw) ? (raw as Specialty) : "";
}

function readCode(raw: string | null, pattern: RegExp): string {
  const value = (raw ?? "").trim();
  return pattern.test(value) ? value.toUpperCase() : "";
}

function readDate(raw: string): string {
  if (!ISO_DAY.test(raw)) return "";
  // `Date.parse("2026-02-30")` rolls over rather than failing, so the day is
  // re-read and compared.
  const [year, month, day] = raw.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return "";
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  return isReal ? raw : "";
}

export function browseViewFromParams(params: Pick<URLSearchParams, "get">): {
  filters: BrowseFormFilters;
  page: number;
  sort: BrowseSort;
} {
  return {
    filters: {
      specialty: readSpecialty(params.get("specialty") ?? ""),
      city: (params.get("city") ?? "").trim(),
      cityCode: readCode(params.get("cityCode"), CITY_CODE),
      department: readCode(params.get("department"), DEPARTMENT_CODE),
      lat: params.get("lat") ?? "",
      lng: params.get("lng") ?? "",
      radiusKm: params.get("radiusKm") ?? "",
      q: (params.get("q") ?? "").trim(),
      from: readDate(params.get("from") ?? ""),
      to: readDate(params.get("to") ?? ""),
      urgentOnly:
        params.get("urgent") === "true" || params.get("sort") === "urgent",
    },
    page: (() => {
      const page = Number(params.get("page") ?? "");
      return Number.isInteger(page) && page >= 1
        ? page
        : DEFAULT_BROWSE_VIEW.page;
    })(),
    sort: (BROWSE_SORT_IDS as readonly string[]).includes(
      params.get("sort") ?? "",
    )
      ? (params.get("sort") as BrowseSort)
      : DEFAULT_BROWSE_VIEW.sort,
  };
}

/**
 * Writes a view back to a query string, omitting every default, so the default
 * view is plain `/listings`.
 */
export function browseViewToParams(
  filters: BrowseFormFilters,
  page: number,
  sort: BrowseSort,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.specialty) params.set("specialty", filters.specialty);
  const city = filters.city.trim();
  if (city) params.set("city", city);
  const cityCode = readCode(filters.cityCode, CITY_CODE);
  if (cityCode) params.set("cityCode", cityCode);
  const department = readCode(filters.department, DEPARTMENT_CODE);
  if (department) params.set("department", department);
  const centre = readCentre(filters.lat, filters.lng, filters.radiusKm);
  if (
    centre.lat !== undefined &&
    centre.lng !== undefined &&
    centre.radiusKm !== undefined
  ) {
    params.set("lat", String(centre.lat));
    params.set("lng", String(centre.lng));
    params.set("radiusKm", String(centre.radiusKm));
  }
  const q = filters.q.trim();
  if (q) params.set("q", q);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.urgentOnly) params.set("urgent", "true");
  if (sort !== DEFAULT_BROWSE_VIEW.sort) params.set("sort", sort);
  if (page !== DEFAULT_BROWSE_VIEW.page) params.set("page", String(page));

  return params;
}

/**
 * The last page that exists when the requested one is past the end, or `null`
 * (including for an empty collection, which the empty state answers).
 */
export function browsePageClamp(
  page: number,
  totalPages: number,
): number | null {
  if (totalPages > 0 && page > totalPages) {
    return totalPages;
  }
  return null;
}
