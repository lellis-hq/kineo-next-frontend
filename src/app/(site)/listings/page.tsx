import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrowseSkeleton } from "@/components/molecules/list-skeleton";
import { ListingsContainer } from "@/components/templates/listings-container";
import { serverTransport } from "@/lib/api-transport.server";
import {
  browsePageClamp,
  browseViewFromParams,
  browseViewToParams,
  fetchBrowseListings,
  fetchBrowsePlaces,
  fetchFacets,
  readLayout,
  toBrowseView,
} from "@/lib/listings";
import { fetchMyProfile } from "@/lib/profile-service";
import { requireMember } from "@/lib/require-member";

export const metadata: Metadata = {
  title: "Annonces — Kineo",
  description:
    "Parcourez les annonces de remplacement ouvertes : filtrez par spécialité, période et urgence, et localisez chaque cabinet sur la carte.",
};

/**
 * The member-only feed. The server only seeds the first render; from there the
 * URL is written with the native History API and the client fetches the new
 * view. The heavy `/places` read is skipped entirely in « Liste seule ».
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

  const showMap = readLayout(params.get("view")) !== "list";
  const [data, facets, home, places] = await requireMember(
    Promise.all([
      fetchBrowseListings(view, serverTransport),
      fetchFacets(view, serverTransport),
      // Where the map opens: the profile's city. Never fatal — the map then
      // reads the browser's time zone, and failing that shows France.
      fetchMyProfile(serverTransport).then(
        (profile) =>
          profile?.latitude != null && profile.longitude != null
            ? { latitude: profile.latitude, longitude: profile.longitude }
            : null,
        () => null,
      ),
      showMap
        ? fetchBrowsePlaces(view, serverTransport).catch(() => null)
        : Promise.resolve(null),
    ]),
  );

  // A page past the end redirects to the last page, rewriting the URL.
  const clampedPage = browsePageClamp(view.page, data.totalPages);
  if (clampedPage !== null) {
    redirect(
      `/listings?${browseViewToParams(filters, clampedPage, sort, readLayout(params.get("view"))).toString()}`,
    );
  }

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
