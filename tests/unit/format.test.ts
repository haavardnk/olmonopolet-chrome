import { describe, it, expect } from "vitest";
import {
  formatCompact,
  formatDate,
  formatNumber,
  formatRating,
} from "../../src/shared/format";

describe("format", () => {
  it.each([
    [3.606, "3,61"],
    [4, "4,00"],
  ])("formats rating %d as %s", (value, expected) => {
    expect(formatRating(value)).toBe(expected);
  });

  it.each([
    [999, "999"],
    [1693, "1,7k"],
    [15000, "15k"],
  ])("formats count %d compactly as %s", (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });

  it("formats numbers with Norwegian separators", () => {
    expect(formatNumber(1693)).toBe("1\u00a0693");
    expect(formatNumber(2.75, 1)).toBe("2,8");
  });

  it("formats dates as dd.mm.yyyy", () => {
    expect(formatDate("2026-07-14T12:00:00Z")).toBe("14.07.2026");
  });
});
