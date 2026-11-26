"use client";

import {
  type KeyboardEvent,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { CloseIcon, MapPinIcon } from "@/components/atoms/icons";
import { cn } from "@/lib/cn";
import { normalizeSearchText } from "@/lib/geo/normalize";
import type { SelectedPlace } from "@/lib/geo/types";
import { usePlaceSuggestions } from "@/lib/hooks/use-place-suggestions";
import { MAP_PILL } from "@/lib/layout";

interface Option {
  id: string;
  label: string;
  detail: string;
  place: SelectedPlace;
}

/**
 * Editable combobox following the WAI-ARIA APG pattern: DOM focus stays on the
 * input while `aria-activedescendant` points at the highlighted option. The
 * reader may also type a label without picking a suggestion.
 */
export function PlaceAutocomplete({
  id,
  label,
  placeholder,
  value,
  onCommit,
  overlay = false,
  className,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onCommit: (place: SelectedPlace | null, text: string) => void;
  overlay?: boolean;
  className?: string;
}) {
  const listId = `${useId()}-list`;
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectingRef = useRef(false);

  useEffect(() => setText(value), [value]);
  const deferredText = useDeferredValue(text);
  const { suggestions, status } = usePlaceSuggestions(open ? deferredText : "");

  const options = useMemo<Option[]>(() => {
    // Completion returns names, not codes. The codes are resolved only when
    // the reader picks a commune, keeping one external call per search.
    const communes = suggestions.communes.map((commune) => ({
      id: `${listId}-c-${normalizeSearchText(commune.nom)}`,
      label: commune.nom,
      detail: "",
      place: {
        kind: "commune" as const,
        label: commune.nom,
        departmentCode: "",
      },
    }));
    const departments = suggestions.departements.map((department) => ({
      id: `${listId}-d-${department.code}`,
      label: `${department.nom} (${department.code})`,
      detail: "Département",
      place: {
        kind: "departement" as const,
        label: department.nom,
        departmentCode: department.code,
      },
    }));
    return [...communes, ...departments];
  }, [suggestions, listId]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const select = async (option: Option) => {
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
        onCommit(null, label);
        inputRef.current?.focus();
        return;
      }
    }

    onCommit(place, label);
    inputRef.current?.focus();
  };

  const commitText = () => {
    const trimmed = text.trim();
    if (trimmed !== value) onCommit(null, trimmed);
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
      if (chosen) select(chosen);
      else commitText();
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const hasSuggestions = options.length > 0;

  return (
    <div
      className={cn(
        "relative min-w-[9rem] flex-1",
        overlay && "xl:min-w-[8rem]",
        className,
      )}
    >
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <MapPinIcon
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted",
            overlay && "xl:text-black/45",
          )}
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && hasSuggestions}
          aria-controls={listId}
          aria-activedescendant={
            open && active >= 0 ? options[active]?.id : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (selectingRef.current) {
              selectingRef.current = false;
              return;
            }
            close();
            commitText();
          }}
          className={cn(
            "field-input rounded-full py-1.5 pl-9 pr-9",
            overlay && MAP_PILL,
            overlay && "xl:placeholder:text-black/45",
          )}
        />
        {text.length > 0 && (
          <button
            type="button"
            aria-label="Effacer la ville"
            // Keep DOM focus on the input: a blur would commit the old text.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText("");
              close();
              onCommit(null, "");
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-2.5 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <CloseIcon className="size-3.5" />
          </button>
        )}
      </div>

      {open && text.trim().length >= 2 && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 z-50 mt-1 max-h-72 w-full min-w-64 overflow-y-auto rounded-control border border-border bg-surface-2 py-1 shadow-lg"
        >
          {status === "loading" && options.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">Recherche…</p>
          )}
          {status === "error" && (
            <p className="px-3 py-2 text-sm text-muted">
              Recherche indisponible, saisissez une ville.
            </p>
          )}
          {status === "ready" && !hasSuggestions && (
            <p className="px-3 py-2 text-sm text-muted">
              Aucune commune ni département trouvé.
            </p>
          )}
          {suggestions.communes.length > 0 && (
            <fieldset className="min-w-0 border-0 p-0">
              <legend className="px-3 pt-1 pb-0.5 text-xs font-medium text-muted">
                Communes
              </legend>
              {options
                .slice(0, suggestions.communes.length)
                .map((option, index) => (
                  <OptionRow
                    key={option.id}
                    option={option}
                    active={active === index}
                    onSelect={select}
                  />
                ))}
            </fieldset>
          )}
          {suggestions.departements.length > 0 && (
            <fieldset className="min-w-0 border-0 p-0">
              <legend className="px-3 pt-1 pb-0.5 text-xs font-medium text-muted">
                Départements
              </legend>
              {options
                .slice(suggestions.communes.length)
                .map((option, index) => (
                  <OptionRow
                    key={option.id}
                    option={option}
                    active={active === suggestions.communes.length + index}
                    onSelect={select}
                  />
                ))}
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}

function OptionRow({
  option,
  active,
  onSelect,
}: {
  option: Option;
  active: boolean;
  onSelect: (option: Option) => void;
}) {
  return (
    <button
      type="button"
      id={option.id}
      role="option"
      aria-selected={active}
      // Keep DOM focus on the input; mousedown would otherwise blur it first.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(option)}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
        active ? "bg-surface-3 text-foreground" : "text-foreground/85",
      )}
    >
      <span className="truncate">{option.label}</span>
      {option.detail && (
        <span className="shrink-0 text-xs text-muted">{option.detail}</span>
      )}
    </button>
  );
}
