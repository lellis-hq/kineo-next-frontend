import { describe, expect, it } from "bun:test";
import {
  invalidateBrowseCache,
  readBrowseCache,
  writeBrowseCache,
} from "./browse-cache";

describe("browse cache", () => {
  it("reads back what was written", () => {
    invalidateBrowseCache();
    writeBrowseCache("a", { total: 2 });
    expect(readBrowseCache<{ total: number }>("a")?.total).toBe(2);
  });

  it("keeps the most recent entries", () => {
    invalidateBrowseCache();
    writeBrowseCache("a", 1);
    writeBrowseCache("b", 2);
    expect(readBrowseCache<number>("a")).toBe(1);
    expect(readBrowseCache<number>("b")).toBe(2);
  });

  it("clears on demand", () => {
    invalidateBrowseCache();
    writeBrowseCache("a", 1);
    invalidateBrowseCache();
    expect(readBrowseCache<number>("a")).toBeUndefined();
  });
});
