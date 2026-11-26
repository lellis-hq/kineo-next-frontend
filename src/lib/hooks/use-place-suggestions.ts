"use client";

import { useEffect, useState } from "react";
import { normalizeSearchText } from "@/lib/geo/normalize";
import type { GeoSuggestions } from "@/lib/geo/types";

const EMPTY: GeoSuggestions = { communes: [], departements: [] };
const cache = new Map<string, GeoSuggestions>();
const inFlight = new Map<string, Promise<GeoSuggestions>>();

async function load(query: string): Promise<GeoSuggestions> {
  const response = await fetch(
    `/api/geo/suggest?q=${encodeURIComponent(query)}`,
    { signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) throw new Error("suggest failed");
  return (await response.json()) as GeoSuggestions;
}

/**
 * Search-as-you-type state for the location combobox: debounce, the minimum
 * two characters the public APIs need, a small cache and single-flight so two
 * components typing the same prefix share one request.
 */
export function usePlaceSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<GeoSuggestions>(EMPTY);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions(EMPTY);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    // The previous query's options must not stay visible during the debounce.
    setSuggestions(EMPTY);
    setStatus("idle");
    const timer = setTimeout(async () => {
      const key = normalizeSearchText(trimmed);
      const cached = cache.get(key);
      if (cached) {
        if (!cancelled) {
          setSuggestions(cached);
          setStatus("ready");
        }
        return;
      }

      setStatus("loading");
      let pending = inFlight.get(key);
      if (!pending) {
        // Send the normalised query, not the raw keystrokes: one URL per
        // search term, and uppercase/accented input behaves identically.
        pending = load(key)
          .then((value) => {
            cache.set(key, value);
            return value;
          })
          .finally(() => inFlight.delete(key));
        inFlight.set(key, pending);
      }

      try {
        const value = await pending;
        if (!cancelled) {
          setSuggestions(value);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { suggestions, status };
}
