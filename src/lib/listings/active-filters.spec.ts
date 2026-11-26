import { describe, expect, it } from "bun:test";
import { activeFilters } from "./active-filters";
import { EMPTY_BROWSE_FILTERS } from "./browse-contracts";

describe("activeFilters", () => {
  it("returns nothing for the default view", () => {
    expect(activeFilters(EMPTY_BROWSE_FILTERS)).toEqual([]);
  });

  it("clears the code along with a city label", () => {
    const [chip] = activeFilters({
      ...EMPTY_BROWSE_FILTERS,
      city: "Paris",
      cityCode: "75056",
      department: "75",
    });
    expect(chip).toMatchObject({
      key: "city",
      label: "Paris",
      clear: { city: "", cityCode: "", department: "" },
    });
  });

  it("names a department chosen without a city", () => {
    expect(
      activeFilters({ ...EMPTY_BROWSE_FILTERS, department: "69" }),
    ).toMatchObject([{ key: "department", label: "Département 69" }]);
  });

  it("names a bounded date range", () => {
    expect(
      activeFilters({
        ...EMPTY_BROWSE_FILTERS,
        from: "2026-10-01",
        to: "2026-10-31",
      }),
    ).toMatchObject([{ key: "dates", label: "Du 2026-10-01 au 2026-10-31" }]);
  });

  it("clears the whole centre when removing the radius", () => {
    expect(
      activeFilters({
        ...EMPTY_BROWSE_FILTERS,
        lat: "45.7",
        lng: "4.8",
        radiusKm: "10",
      }),
    ).toMatchObject([
      {
        key: "radius",
        label: "Autour de moi · 10 km",
        clear: { lat: "", lng: "", radiusKm: "" },
      },
    ]);
  });
});
