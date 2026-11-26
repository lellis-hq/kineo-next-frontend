import type { NextRequest } from "next/server";
import { GeoUnavailableError } from "@/lib/geo/fetch";
import { resolveCommune } from "@/lib/geo/suggest";

const CACHE = "public, max-age=86400, stale-while-revalidate=604800";

/** Resolve a picked commune into the stable codes the backend stores. */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return Response.json({ error: "Recherche trop courte" }, { status: 400 });
  }

  try {
    const place = await resolveCommune(query);
    return Response.json(place, { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    if (error instanceof GeoUnavailableError) {
      return Response.json(
        { error: "Service de recherche géographique indisponible" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { error: "Commune introuvable" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
}
