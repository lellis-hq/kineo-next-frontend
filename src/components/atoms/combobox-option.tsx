import { cn } from "@/lib/cn";

/** One option of a listbox popup; DOM focus stays on the combobox input. */
export function ComboboxOption({
  id,
  label,
  detail,
  active,
  onSelect,
}: {
  id: string;
  label: string;
  detail: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
        active ? "bg-surface-3 text-foreground" : "text-foreground/85",
      )}
    >
      <span className="truncate">{label}</span>
      {detail && <span className="shrink-0 text-xs text-muted">{detail}</span>}
    </button>
  );
}
