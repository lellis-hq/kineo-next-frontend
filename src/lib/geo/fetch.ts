/**
 * The public geo APIs cap traffic at 50 requests/second per IP. Our server is
 * the single IP for every visitor, so a burst can legitimately answer 429.
 * Retry on `retry-after`, then fail loudly: a failed lookup must never be
 * reported as "no result" — the combobox shows an explicit error instead.
 */
export class GeoUnavailableError extends Error {
  constructor() {
    super("Service de recherche géographique indisponible");
    this.name = "GeoUnavailableError";
  }
}

const MAX_ATTEMPTS = 2;

export async function fetchGeoJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 429 && attempt + 1 < MAX_ATTEMPTS) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((done) =>
        setTimeout(
          done,
          Math.min(Number.isFinite(retryAfter) ? retryAfter : 1, 5) * 1000,
        ),
      );
      continue;
    }

    if (!response.ok) throw new GeoUnavailableError();
    return (await response.json()) as T;
  }

  throw new GeoUnavailableError();
}
