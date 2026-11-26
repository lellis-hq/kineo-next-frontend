import { describe, expect, it } from "bun:test";
import { filterDepartements } from "./filter";
import type { DepartmentSuggestion } from "./types";

const departments: DepartmentSuggestion[] = [
  { code: "69", nom: "Rhône", codeRegion: "84" },
  { code: "75", nom: "Paris", codeRegion: "11" },
  { code: "2A", nom: "Corse-du-Sud", codeRegion: "94" },
];

describe("filterDepartements", () => {
  it("finds a department without accents", () => {
    expect(filterDepartements(departments, "RHONE", 6)[0]?.code).toBe("69");
  });

  it("matches a code prefix before a name", () => {
    expect(filterDepartements(departments, "2", 6)[0]?.code).toBe("2A");
  });

  it("caps the number of suggestions", () => {
    expect(filterDepartements(departments, "", 1)).toHaveLength(1);
  });
});
