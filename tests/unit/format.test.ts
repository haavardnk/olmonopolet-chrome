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
  it("renders 5 star svgs in a .stars span", () => {
    const el = ratingToStars(3.6);
    expect(el.classList.contains("stars")).toBe(true);
    expect(el.querySelectorAll("svg")).toHaveLength(5);
  });

  it("fills full stars yellow and leaves empty stars gray", () => {
    const svgs = [...ratingToStars(3).querySelectorAll("svg")];
    expect(svgs[0].getAttribute("fill")).toBe("#facc15");
    expect(svgs[2].getAttribute("fill")).toBe("#facc15");
    expect(svgs[4].getAttribute("fill")).toBe("none");
    expect(svgs[4].getAttribute("stroke")).toBe("#d1d5db");
  });

  it("renders a half star for ratings with .5 or more", () => {
    const svgs = [...ratingToStars(3.5).querySelectorAll("svg")];
    // 3 full + 1 half + 1 empty
    expect(svgs[3].getAttribute("fill")).toBe("#facc15");
    const half = svgs[3].querySelector("path")?.getAttribute("d") ?? "";
    expect(half.startsWith("M12 18.338")).toBe(true);
  });
});

describe("formatUpdated", () => {
  it("prefixes with Oppdatert", () => {
    expect(formatUpdated("2026-07-14T22:39:32Z")).toMatch(/^Oppdatert: /);
  });
});
