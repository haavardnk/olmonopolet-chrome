import { describe, it, expect } from "vitest";
import {
  kFormatter,
  ratingToStars,
  formatUpdated,
} from "../../src/shared/format";

describe("kFormatter", () => {
  it("formats thousands with k", () => {
    expect(kFormatter(1693)).toBe("2k");
    expect(kFormatter(15000)).toBe("15k");
  });

  it("keeps small numbers as-is", () => {
    expect(kFormatter(999)).toBe("999");
    expect(kFormatter(42)).toBe("42");
  });
});

describe("ratingToStars", () => {
  it("renders 5 star images in a .stars span", () => {
    const el = ratingToStars(3.6);
    expect(el.classList.contains("stars")).toBe(true);
    expect(el.querySelectorAll("img")).toHaveLength(5);
  });

  it("uses solid for full and hollow for empty stars", () => {
    const imgs = [...ratingToStars(3).querySelectorAll("img")];
    expect(imgs[0].src).toContain("star-solid");
    expect(imgs[2].src).toContain("star-solid");
    expect(imgs[4].src).toContain("star-hollow");
  });

  it("uses half star for fractional ratings", () => {
    const imgs = [...ratingToStars(3.5).querySelectorAll("img")];
    expect(imgs[3].src).toContain("star-half");
  });
});

describe("formatUpdated", () => {
  it("prefixes with Oppdatert", () => {
    expect(formatUpdated("2026-07-14T22:39:32Z")).toMatch(/^Oppdatert: /);
  });
});
