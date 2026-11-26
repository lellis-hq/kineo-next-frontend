"use client";

import { useEffect, useRef, useState } from "react";
import { useLatest } from "@/lib/hooks/use-latest";

/**
 * A text field that applies its value after `delay` of quiet typing. Re-syncs
 * from the prop like `useCommittedInput`; `onCommit` is read through a ref so
 * a new identity doesn't restart the timer.
 */
export function useDebouncedInput(
  committed: string,
  onCommit: (value: string) => void,
  delay = 300,
) {
  const [draft, setDraft] = useState(committed);
  const committedRef = useLatest(committed);
  const lastSentRef = useRef<string | null>(null);
  const onCommitRef = useLatest(onCommit);

  // An external change (reset, back button) becomes the new draft; the echo of
  // our own commit does not, or it would clobber newer keystrokes.
  useEffect(() => {
    if (shouldAdoptCommitted(committed, lastSentRef.current)) {
      lastSentRef.current = null;
      setDraft(committed);
    }
  }, [committed]);

  useEffect(() => {
    if (draft === committedRef.current) return;
    const timer = setTimeout(() => {
      const trimmed = draft.trim();
      if (trimmed !== committedRef.current) {
        lastSentRef.current = trimmed;
        onCommitRef.current(trimmed);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [draft, delay]);

  return { draft, setDraft };
}

/**
 * Whether an arriving committed value should replace the draft. A value equal
 * to what this field last sent is the echo of its own commit, which lands after
 * navigation — the draft may already be newer.
 */
export function shouldAdoptCommitted(
  committed: string,
  lastSent: string | null,
): boolean {
  return committed !== lastSent;
}
