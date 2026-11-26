import { Chip } from "@/components/atoms/chip";
import { CloseIcon } from "@/components/atoms/icons";
import { TextButton } from "@/components/atoms/text-button";
import type { BrowseFormFilters } from "@/lib/listings";
import { SPECIALTY_LABELS } from "@/lib/profile";

interface ActiveFilter {
  key: string;
  label: string;
  /** The patch that removes only this filter. */
  clear: Partial<BrowseFormFilters>;
}

function activeFilters(filters: BrowseFormFilters): ActiveFilter[] {
  const chips: ActiveFilter[] = [];

  if (filters.specialty) {
    chips.push({
      key: "specialty",
      label: SPECIALTY_LABELS[filters.specialty],
      clear: { specialty: "" },
    });
  }
  if (filters.city) {
    chips.push({
      key: "city",
      label: filters.city,
      clear: { city: "", cityCode: "", department: "" },
    });
  } else if (filters.department) {
    chips.push({
      key: "department",
      label: `Département ${filters.department}`,
      clear: { department: "" },
    });
  }
  if (filters.q.trim()) {
    chips.push({
      key: "q",
      label: `« ${filters.q.trim()} »`,
      clear: { q: "" },
    });
  }
  if (filters.from || filters.to) {
    const label = filters.from
      ? filters.to
        ? `Du ${filters.from} au ${filters.to}`
        : `À partir du ${filters.from}`
      : `Jusqu'au ${filters.to}`;
    chips.push({ key: "dates", label, clear: { from: "", to: "" } });
  }
  if (filters.urgentOnly) {
    chips.push({
      key: "urgent",
      label: "Urgentes",
      clear: { urgentOnly: false },
    });
  }
  if (filters.lat && filters.radiusKm) {
    chips.push({
      key: "radius",
      label: `Autour de moi · ${filters.radiusKm} km`,
      clear: { lat: "", lng: "", radiusKm: "" },
    });
  }

  return chips;
}

/** The filters currently narrowing the feed, each removable on its own. */
export function ActiveFilterChips({
  filters,
  onFiltersChange,
  onResetFilters,
}: {
  filters: BrowseFormFilters;
  onFiltersChange: (patch: Partial<BrowseFormFilters>) => void;
  onResetFilters: () => void;
}) {
  const chips = activeFilters(filters);
  if (chips.length === 0) return null;

  return (
    <fieldset className="mb-3 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
      <legend className="sr-only">Filtres actifs</legend>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          size="sm"
          aria-label={`Retirer le filtre ${chip.label}`}
          onClick={() => onFiltersChange(chip.clear)}
        >
          {chip.label}
          <CloseIcon className="ml-1.5 inline-block size-3 align-[-0.1em]" />
        </Chip>
      ))}
      <TextButton onClick={onResetFilters}>Tout effacer</TextButton>
    </fieldset>
  );
}
