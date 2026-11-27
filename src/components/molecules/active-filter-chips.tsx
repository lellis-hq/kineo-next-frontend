import { Chip } from "@/components/atoms/chip";
import { CloseIcon } from "@/components/atoms/icons";
import { TextButton } from "@/components/atoms/text-button";
import { activeFilters, type BrowseFormFilters } from "@/lib/listings";

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
          className="row-enter"
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
