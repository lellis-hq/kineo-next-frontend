"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLatest } from "./use-latest";

/**
 * Keep a client-side view in the URL with the native History API: shareable,
 * restorable by the back button, but without a server re-render on each change.
 * `read` and `write` must be inverse for the fields the page owns.
 */
export function useViewUrl<V>({
  read,
  write,
}: {
  read: (params: URLSearchParams) => V;
  write: (view: V, params: URLSearchParams) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  const readRef = useLatest(read);
  const writeRef = useLatest(write);
  const [view, setView] = useState<V>(() =>
    readRef.current(new URLSearchParams(key)),
  );
  const lastKey = useRef(key);

  useEffect(() => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    setView(readRef.current(new URLSearchParams(key)));
  }, [key]);

  const setViewUrl = useCallback(
    (next: V, method: "replace" | "push" = "replace") => {
      setView(next);
      const params = new URLSearchParams();
      writeRef.current(next, params);
      const search = params.toString();
      lastKey.current = search;
      const url = search ? `${pathname}?${search}` : pathname;
      if (method === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  return { view, setView: setViewUrl };
}
