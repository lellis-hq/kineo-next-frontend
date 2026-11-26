import type { NextRequest } from "next/server";
import { normalizeSearchText } from "@/lib/geo/normalize";
import { searchPlaces } from "@/lib/geo/suggest";

/**
 * Same-origin endpoint for the location combobox. The public geo APIs are
 * called from here (frontend repo), never from the Nest backend, and the
 * result is cached by `searchPlaces` with `'use cache'`.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (normalizeSearchText(query).length < 2) {
    return Response.json(
      { communes: [], departements: [] },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }

  const suggestions = await searchPlaces(query);
  return Response.json(suggestions, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
