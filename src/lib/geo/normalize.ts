/**
 * The same normalisation for the query sent to the public APIs and for the
 * text we compare in tests. Diacritics and mixed separators are folded so
 * `Rhône`, `rhone` and `Saint-Étienne` all find their place.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
