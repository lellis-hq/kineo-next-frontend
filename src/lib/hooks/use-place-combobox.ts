"use client";

import {
  type KeyboardEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildPlaceOptions, type PlaceOption } from "@/lib/geo/options";
import type { SelectedPlace } from "@/lib/geo/types";
import { useLatest } from "./use-latest";
import { usePlaceSuggestions } from "./use-place-suggestions";

/**
 * State machine of the location combobox: text, popup, keyboard selection and
 * the code resolution that happens when a reader picks a commune. Kept out of
 * the component so the component only renders the WAI-ARIA structure.
 */
export function usePlaceCombobox({
  value,
  onCommit,
  listId,
}: {
  value: string;
  onCommit: (place: SelectedPlace | null, text: string) => void;
  listId: string;
}) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectingRef = useRef(false);
  const onCommitRef = useLatest(onCommit);
  const committedRef = useLatest(value);

  useEffect(() => setText(value), [value]);

  const deferredText = useDeferredValue(text);
  const { suggestions, status } = usePlaceSuggestions(open ? deferredText : "");
  const options = useMemo(
    () => buildPlaceOptions(suggestions, listId),
    [suggestions, listId],
  );

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const select = useCallback(
    async (option: PlaceOption) => {
      selectingRef.current = true;
      const label = option.place.label;
      setText(label);
      close();

      let place = option.place;
      if (place.kind === "commune" && !place.cityCodeInsee) {
        try {
          const response = await fetch(
            `/api/geo/resolve?q=${encodeURIComponent(label)}`,
          );
          if (!response.ok) throw new Error("resolve failed");
          place = (await response.json()) as SelectedPlace;
        } catch {
          // Resolution is best-effort: free text still filters the listings.
          onCommitRef.current(null, label);
          focusInput();
          return;
        }
      }

      onCommitRef.current(place, label);
      focusInput();
    },
    [close, focusInput],
  );

  const commitText = () => {
    const trimmed = text.trim();
    if (trimmed !== committedRef.current) onCommitRef.current(null, trimmed);
  };

  const clear = () => {
    setText("");
    close();
    onCommitRef.current(null, "");
    focusInput();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current <= 0 ? options.length - 1 : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = open ? options[active] : undefined;
      if (chosen) void select(chosen);
      else commitText();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const onBlur = () => {
    if (selectingRef.current) {
      selectingRef.current = false;
      return;
    }
    close();
    commitText();
  };

  const onChange = (next: string) => {
    setText(next);
    setOpen(true);
    setActive(-1);
  };

  return {
    text,
    open,
    active,
    options,
    status,
    inputRef,
    hasSuggestions: options.length > 0,
    suggestions,
    onChange,
    onFocus: () => setOpen(true),
    onKeyDown,
    onBlur,
    onSelect: select,
    clear,
  };
}
