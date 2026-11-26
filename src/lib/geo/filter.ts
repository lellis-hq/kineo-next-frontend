import { normalizeSearchText } from "./normalize";
import type { DepartmentSuggestion } from "./types";

/**
 * The 101 departments are fetched once and kept in the Next.js cache; filtering
 * them here avoids an API call for every keystroke. No data is written in code.
 */
export function filterDepartements(
  departements: readonly DepartmentSuggestion[],
  query: string,
  limit: number,
): DepartmentSuggestion[] {
  const normalized = normalizeSearchText(query);
  const code = query.trim().toUpperCase();

  return departements
    .filter(
      (department) =>
        department.code === code ||
        department.code.startsWith(code) ||
        normalizeSearchText(department.nom).includes(normalized),
    )
    .sort((left, right) => {
      const leftCode = left.code.startsWith(code) ? 0 : 1;
      const rightCode = right.code.startsWith(code) ? 0 : 1;
      return leftCode - rightCode || left.code.localeCompare(right.code);
    })
    .slice(0, limit);
}
