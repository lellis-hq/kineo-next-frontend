/**
 * Whether an arriving committed value should replace a field's draft. A value
 * equal to what the field last sent is the echo of its own commit, which lands
 * after navigation — the draft may already be newer.
 */
export function shouldAdoptCommitted(
  committed: string,
  lastSent: string | null,
): boolean {
  return committed !== lastSent;
}
