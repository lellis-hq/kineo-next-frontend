"use client";

import { Chip } from "@/components/atoms/chip";
import { CrosshairIcon } from "@/components/atoms/icons";
import { Select } from "@/components/molecules/select";
import { useDebouncedInput } from "@/lib/hooks/use-debounced-input";
import { useLocationFilters } from "@/lib/hooks/use-location-filters";
import type { BrowseFormFilters } from "@/lib/listings";
import type { Specialty } from "@/lib/types/api";

export interface SpecialtyOption {
  id: Specialty;
  label: string;
}

const RADII = ["5", "10", "25", "50"] as const;

/**
 * The filters behind « Filtres ». The date fields are debounced: a native date
 * input can emit several changes while one date is chosen.
 */
export function BrowseFilterFields({
  filters,
  onFiltersChange,
  specialties,
  filtered,
  onResetFilters,
}: {
  filters: BrowseFormFilters;
  onFiltersChange: (patch: Partial<BrowseFormFilters>) => void;
  specialties: readonly SpecialtyOption[];
  filtered: boolean;
  onResetFilters: () => void;
}) {
  const { draft: fromDraft, setDraft: setFrom } = useDebouncedInput(
    filters.from,
    (value) => onFiltersChange({ from: value }),
  );
  const { draft: toDraft, setDraft: setTo } = useDebouncedInput(
    filters.to,
    (value) => onFiltersChange({ to: value }),
  );
  const { locate, clearLocation } = useLocationFilters(
    filters,
    onFiltersChange,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="field-label" htmlFor="browse-specialty">
          Spécialité
        </label>
        <Select
          id="browse-specialty"
          className="rounded-full py-1.5"
          value={filters.specialty}
          onChange={(event) =>
            onFiltersChange({
              specialty: event.target.value as Specialty | "",
            })
          }
        >
          <option value="">Toutes spécialités</option>
          {specialties.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="field-label">Recherche géographique</span>
        <div className="grid grid-cols-2 gap-2">
          <Chip size="sm" className="justify-center" onClick={locate}>
            <CrosshairIcon className="mr-1 inline-block size-3.5 align-[-0.15em]" />
            Me géolocaliser
          </Chip>
          <Select
            id="browse-radius"
            aria-label="Rayon de recherche"
            className="rounded-full py-1.5"
            value={filters.radiusKm || "10"}
            disabled={!filters.lat}
            onChange={(event) =>
              onFiltersChange({ radiusKm: event.target.value })
            }
          >
            {RADII.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </Select>
        </div>
        {!filters.lat && (
          <p className="text-xs text-muted">
            Géolocalisez-vous pour activer le rayon de recherche.
          </p>
        )}
        {filters.lat && (
          <button
            type="button"
            onClick={clearLocation}
            className="text-xs font-medium text-primary hover:opacity-80"
          >
            Désactiver la recherche autour de moi
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="field-label">Date de début</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label className="sr-only" htmlFor="browse-from">
              Démarrant après le
            </label>
            <input
              id="browse-from"
              type="date"
              aria-label="Démarrant après le"
              className="field-input w-full min-w-0 rounded-full py-1.5"
              value={fromDraft}
              // The applied `to`, not its draft.
              max={filters.to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className="sr-only" htmlFor="browse-to">
              Démarrant avant le
            </label>
            <input
              id="browse-to"
              type="date"
              aria-label="Démarrant avant le"
              className="field-input w-full min-w-0 rounded-full py-1.5"
              value={toDraft}
              min={filters.from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>
      </div>

      {filtered && (
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          Tout réinitialiser
        </button>
      )}
    </div>
  );
}
