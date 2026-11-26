import type { NextRequest } from "next/server";
import { GeoUnavailableError } from "@/lib/geo/fetch";
import { normalizeSearchText } from "@/lib/geo/normalize";
import { searchPlaces } from "@/lib/geo/suggest";

const CACHE = "public, max-age=86400, stale-while-revalidate=604800";

/**
 * Same-origin endpoint for the location combobox. Public geo APIs are called
 * from here (frontend repo), never from the Nest backend.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (normalizeSearchText(query).length < 2) {
    return Response.json(
      { communes: [], departements: [] },
      { headers: { "Cache-Control": CACHE } },
    );
  }

  try {
    const suggestions = await searchPlaces(query);
    return Response.json(suggestions, {
      headers: { "Cache-Control": CACHE },
    });
  } catch (error) {
    // A rate limit or an outage is not "no result": the combobox shows an
    // explicit error and the reader can still type a city by hand.
    if (error instanceof GeoUnavailableError) {
      return Response.json(
        { error: "Service de recherche géographique indisponible" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw error;
  }
}
