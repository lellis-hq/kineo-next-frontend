import { describe, expect, it } from "bun:test";
import { normalizeSearchText } from "./normalize";

describe("normalizeSearchText", () => {
  it("folds accents so a reader can type without them", () => {
    expect(normalizeSearchText("Rhône")).toBe("rhone");
    expect(normalizeSearchText("Saint-Étienne")).toBe("saint etienne");
  });

  it("keeps digits for a postcode query", () => {
    expect(normalizeSearchText(" 69001 ")).toBe("69001");
  });
});
