"use client";

import { useId } from "react";
import { ComboboxOption } from "@/components/atoms/combobox-option";
import { CloseIcon, MapPinIcon } from "@/components/atoms/icons";
import { cn } from "@/lib/cn";
import type { SelectedPlace } from "@/lib/geo/types";
import { usePlaceCombobox } from "@/lib/hooks/use-place-combobox";
import { MAP_PILL } from "@/lib/layout";

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
  const combobox = usePlaceCombobox({ value, onCommit, listId });
  const {
    text,
    open,
    active,
    options,
    status,
    inputRef,
    hasSuggestions,
    suggestions,
    onChange,
    onFocus,
    onKeyDown,
    onBlur,
    onSelect,
    clear,
  } = combobox;

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
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
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
            onMouseDown={(event) => event.preventDefault()}
            onClick={clear}
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
          className="combobox-popup absolute top-full left-0 z-50 mt-1 max-h-72 w-full min-w-64 overflow-y-auto rounded-control border border-border bg-surface-2 py-1 shadow-lg"
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
                  <ComboboxOption
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    detail={option.detail}
                    active={active === index}
                    onSelect={() => void onSelect(option)}
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
                  <ComboboxOption
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    detail={option.detail}
                    active={active === suggestions.communes.length + index}
                    onSelect={() => void onSelect(option)}
                  />
                ))}
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
