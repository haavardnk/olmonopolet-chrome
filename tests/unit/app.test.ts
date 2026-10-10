import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HEALTH_CHECKS } from "../../src/content/app";
import { detectPage } from "../../src/content/router";

function fixture(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../fixtures", name),
    "utf-8",
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectPage", () => {
  it.each([
    ["/Land/Norge/Disko-Agent/p/15616302", "details"],
    ["/cart", "cart"],
    ["/my-account/wishlist", "wishlist"],
    ["/search", "search"],
    ["/", "unknown"],
  ])("detects %s as %s", (path, expected) => {
    expect(detectPage(path)).toBe(expected);
  });

  it("treats other pages with a product list as search", () => {
    document.body.innerHTML = fixture("search.html");
    expect(detectPage("/kampanje")).toBe("search");
  });
});

describe("HEALTH_CHECKS", () => {
  it.each([
    ["search", "search.html"],
    ["details", "details.html"],
    ["cart", "cart.html"],
  ] as const)("reports nothing missing on the %s fixture", (page, file) => {
    document.body.innerHTML = fixture(file);
    expect(HEALTH_CHECKS[page]()).toEqual([]);
  });

  it("accepts an empty search result", () => {
    document.body.innerHTML = `<main><select><option value="relevance"></option></select><p>Vi fant ingen varer som passer til dette søket</p></main>`;
    expect(HEALTH_CHECKS.search()).toEqual([]);
  });

  it("flags missing cards on a search page with results", () => {
    document.body.innerHTML = `<main><select><option value="relevance"></option></select><ol><li>Kort</li></ol></main>`;
    expect(HEALTH_CHECKS.search()).toEqual(["productCard"]);
  });

  it("flags a missing card anchor", () => {
    document.body.innerHTML = fixture("search.html");
    document.querySelector('button[aria-label="Min liste"]')?.remove();
    document.querySelector('button[aria-label^="Gi produkt"]')?.remove();
    expect(HEALTH_CHECKS.search()).toEqual(["tools"]);
  });
});
