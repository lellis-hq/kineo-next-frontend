import { Chip } from "@/components/atoms/chip";
import { CrosshairIcon } from "@/components/atoms/icons";

/** The browser-geolocation action, shown only in layouts without a map. */
export function LocateChip({ onLocate }: { onLocate: () => void }) {
  return (
    <Chip
      size="md"
      aria-label="Rechercher autour de moi"
      className="shrink-0 whitespace-nowrap"
      onClick={onLocate}
    >
      <CrosshairIcon className="mr-1 inline-block size-3.5 align-[-0.15em]" />
      Autour de moi
    </Chip>
  );
}
