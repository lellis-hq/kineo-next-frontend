import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrowseSkeleton } from "@/components/molecules/list-skeleton";
import { ListingsContainer } from "@/components/templates/listings-container";
import { serverTransport } from "@/lib/api-transport.server";
import {
  browsePageClamp,
  browseViewFromParams,
  browseViewToParams,
  fetchBrowsePlaces,
  toBrowseView,
} from "@/lib/listings";
import {
  getCachedBrowseFacets,
  getCachedBrowseFeed,
} from "@/lib/listings/browse-cache.server";
import { fetchMyProfile } from "@/lib/profile-service";
import { requireMember } from "@/lib/require-member";
import { fetchKnownServerAuth } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "Annonces — Kineo",
  description:
    "Parcourez les annonces de remplacement ouvertes : filtrez par spécialité, période et urgence, et localisez chaque cabinet sur la carte.",
};

/**
 * The member-only feed, resolved on the server. The URL is the source of
 * truth: all three reads are seeded from it, and the client never refetches.
 *
 * The rows and facets are awaited; the map's places stay a promise, unwrapped
 * behind a `<Suspense>` in the container, so the slowest read can't hold up
 * the list.
 */
export default function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <Listings searchParams={searchParams} />
    </Suspense>
  );
}

async function Listings({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Rebuilt as `URLSearchParams` so server and client parse the same way.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.append(key, value);
    else if (Array.isArray(value))
      for (const item of value) params.append(key, item);
  }
  const { filters, page, sort } = browseViewFromParams(params);
  const view = toBrowseView(filters, page, sort);

  // A cache hit never reaches the backend, so the member check can no longer
  // rely on a 401 from the feed. The layout already read the session this
  // request; fetchServerAuth is request-memoised, so this adds no backend call.
  const auth = await fetchKnownServerAuth();
  if (auth.status === "anonymous") redirect("/signin");
  const cookie = (await headers()).get("cookie") ?? "";

  const [data, facets, home] = await requireMember(
    Promise.all([
      getCachedBrowseFeed(cookie, view),
      getCachedBrowseFacets(
        cookie,
        view.city,
        view.q,
        view.startDateFrom,
        view.startDateTo,
        view.urgentOnly,
      ),
      // Where the map opens: the profile's city. Never fatal — the map then
      // reads the browser's time zone, and failing that shows France.
      fetchMyProfile(serverTransport).then(
        (profile) =>
          profile?.latitude != null && profile.longitude != null
            ? { latitude: profile.latitude, longitude: profile.longitude }
            : null,
        () => null,
      ),
    ]),
  );

  // A page past the end redirects to the last page, rewriting the URL.
  const clampedPage = browsePageClamp(view.page, data.totalPages);
  if (clampedPage !== null) {
    redirect(
      `/listings?${browseViewToParams(filters, clampedPage, sort).toString()}`,
    );
  }

  const places = fetchBrowsePlaces(view, serverTransport).catch(() => null);

  // A failed places read starts the map empty rather than failing the page.
  return (
    <ListingsContainer
      initialData={data}
      initialFacets={facets}
      initialPlaces={places}
      homeCoordinates={home}
    />
  );
}
