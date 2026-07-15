import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleSearch } from "../../src/content/pages/search";
import { clearBeerCache } from "../../src/content/api/client";

function fixture(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../fixtures", name),
    "utf-8",
  );
}

function mockBeers(results: unknown[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) }),
  );
}

beforeEach(() => {
  clearBeerCache();
  vi.restoreAllMocks();
  document.body.innerHTML = fixture("search.html");
});

describe("handleSearch", () => {
  it("injects a rating with stars and an olmonopolet link", async () => {
    mockBeers([
      { vmp_id: 15616302, rating: 3.6, style: "IPA - American", badges: [] },
    ]);

    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    expect(card.querySelector(".untappd")).not.toBeNull();
    expect(card.querySelector(".stars")).not.toBeNull();
    expect(card.querySelector(".untappd a")?.getAttribute("href")).toContain(
      "olmonopolet.app/products/15616302",
    );
  });

  it("appends the beer style to the category name", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6, style: "IPA - American" }]);

    await handleSearch();

    expect(
      document.querySelector(".product__category-name")?.textContent,
    ).toContain("IPA - American");
  });

  it("does not double-inject on repeated runs", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6 }]);

    await handleSearch();
    await handleSearch();

    expect(document.querySelectorAll(".untappd")).toHaveLength(1);
  });
});
