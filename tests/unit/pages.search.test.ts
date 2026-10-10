import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleSearch } from "../../src/content/pages/search";
import { isBeerSearch } from "../../src/content/core/beerQuery";
import { clearBeerCache } from "../../src/content/api/client";
import { clearListsCache } from "../../src/content/api/lists";
import type { Settings } from "../../src/shared/settings";

const BEER_QUERY = ":relevance:mainCategory:øl";

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

function stubChrome(settings: Partial<Settings>, token?: string): void {
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({
          [key]: key === "olmono:settings" ? settings : token,
        })),
        set: vi.fn(),
        remove: vi.fn(),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  });
}

beforeEach(() => {
  clearBeerCache();
  clearListsCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
  document.body.innerHTML = fixture("search.html");
});

describe("isBeerSearch", () => {
  it.each([
    [":relevance:mainCategory:øl", true],
    [":relevance:mainCategory:sider:mainCategory:mjød", true],
    [
      ":relevance:mainCategory:alkoholfritt:mainSubCategory:alkoholfritt_alkoholfritt_øl",
      true,
    ],
    [":relevance:mainCategory:alkoholfritt", false],
    [":relevance:mainCategory:rødvin", false],
    [":relevance:mainCategory:øl:mainCategory:rødvin", false],
    [":relevance", false],
  ])("%s -> %s", (query, expected) => {
    expect(isBeerSearch(query, false)).toBe(expected);
  });

  it("accepts a text search only when beers are found", () => {
    expect(isBeerSearch("ipa:relevance", true)).toBe(true);
    expect(isBeerSearch("ipa:relevance", false)).toBe(false);
  });
});

describe("handleSearch", () => {
  it("injects a rating with stars and an olmonopolet link", async () => {
    mockBeers([
      { vmp_id: 15616302, rating: 3.6, style: "IPA - American", badges: [] },
    ]);

    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    expect(card.querySelector(".olmono-row")).not.toBeNull();
    expect(card.querySelector(".olmono-star")).not.toBeNull();
    expect(
      card.querySelector("a.olmono-rating")?.getAttribute("href"),
    ).toContain("olmonopolet.app/products/15616302");
  });

  it("appends the beer style to the category name", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6, style: "IPA - American" }]);

    await handleSearch();

    expect(
      document.querySelector('[data-track-link-click="product-categories"]')
        ?.textContent,
    ).toContain("IPA - American");
  });

  it("does not double-inject on repeated runs", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6 }]);

    await handleSearch();
    await handleSearch();

    expect(document.querySelectorAll(".olmono-row")).toHaveLength(1);
  });

  it("shows the unit price under the card price", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6, price_per_alcohol_unit: 39 }]);

    await handleSearch();
    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    const unitPrices = card.querySelectorAll(".olmono-unit-price");
    expect(unitPrices).toHaveLength(1);
    expect(unitPrices[0].textContent).toBe("39 kr/alkoholenhet");
    expect(unitPrices[0].parentElement).toBe(card.querySelector("div.price"));
  });

  it("replaces stale injections when the page reuses a card for another product", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6, style: "IPA - American" }]);
    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    card
      .querySelectorAll('a[href*="/p/15616302"]')
      .forEach((a) =>
        a.setAttribute(
          "href",
          a.getAttribute("href")!.replace("15616302", "999"),
        ),
      );
    clearBeerCache();
    mockBeers([{ vmp_id: 999, rating: 4.2, style: "Stout" }]);
    await handleSearch();

    const rows = card.querySelectorAll(".olmono-row");
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute("data-olmono")).toBe("999");
    expect(rows[0].textContent).toContain("4,20");
    const category = card.querySelector(
      '[data-track-link-click="product-categories"]',
    )!.textContent;
    expect(category).toContain("Stout");
    expect(category).not.toContain("IPA");
  });

  it("removes the skeleton when no beer matches", async () => {
    mockBeers([]);

    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    expect(card.querySelector(".olmono-row")).toBeNull();
    expect(card.querySelector(".olmono-skeleton")).toBeNull();
  });

  it("injects a tasted button into the card tools when connected", async () => {
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({
            [key]: key === "olmono:settings" ? { tastedDim: true } : "tok",
          })),
          set: vi.fn(),
          remove: vi.fn(),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    mockBeers([{ vmp_id: 15616302, rating: 3.6, user_tasted: true }]);

    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    const btn = card.querySelector(".olmono-tasted-btn");
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-label")).toBe("Smakt");
    expect(card.classList.contains("olmono-tasted-card")).toBe(true);
  });

  it("does not inject a tasted button when not connected", async () => {
    mockBeers([{ vmp_id: 15616302, rating: 3.6, user_tasted: true }]);

    await handleSearch();

    expect(document.querySelector(".olmono-tasted-btn")).toBeNull();
  });

  it("renders value score and fills the missing label image", async () => {
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 154;
      naturalHeight = 377;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({
            [key]:
              key === "olmono:settings"
                ? { labelImage: "fill-if-missing" }
                : undefined,
          })),
          set: vi.fn(),
          remove: vi.fn(),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    mockBeers([
      {
        vmp_id: 15616302,
        rating: 3.6,
        value_score: 8.0,
        label_hd_url: "https://labels.example/label.jpg",
      },
    ]);

    await handleSearch();
    await new Promise((r) => setTimeout(r, 0));

    const card = document.querySelector("ul.product-list > li")!;
    const value = card.querySelector(".olmono-fact .olmono-value");
    expect(value?.classList.contains("olmono-value--warning")).toBe(true);
    expect(value?.getAttribute("title")).toBe("Verdi for pengene: Middels");
    expect(card.querySelector("img")?.src).toContain(
      "labels.example/label.jpg",
    );
  });
});

describe("olmonopolet sorting on search", () => {
  it("shows no toolbar outside beer searches", async () => {
    history.replaceState(null, "", "/search?q=:relevance:mainCategory:rødvin");
    mockBeers([]);

    await handleSearch();

    expect(document.querySelector(".olmono-toolbar")).toBeNull();
  });

  it("adds the sort toolbar next to the vinmonopolet sort", async () => {
    history.replaceState(null, "", `/search?q=${BEER_QUERY}`);
    mockBeers([]);

    await handleSearch();

    const bar = document.querySelector(".olmono-toolbar")!;
    const sortWrap = document.querySelector(
      'select:has(option[value="relevance"])',
    )!.parentElement;
    expect(bar.nextElementSibling).toBe(sortWrap);
    expect(bar.querySelector<HTMLSelectElement>("select")?.value).toBe("vmp");
    expect(bar.querySelector<HTMLButtonElement>(".olmono-chip")?.hidden).toBe(
      true,
    );
  });

  it("hides tasted cards in vinmonopolet order", async () => {
    history.replaceState(null, "", `/search?q=${BEER_QUERY}`);
    stubChrome({ hideTasted: true }, "tok");
    mockBeers([{ vmp_id: 15616302, rating: 3.6, user_tasted: true }]);

    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    expect(card.classList.contains("olmono-hidden-card")).toBe(true);
    const chip = document.querySelector<HTMLButtonElement>(".olmono-chip")!;
    expect(chip.hidden).toBe(false);
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.textContent).toBe("Skjul smakte (1)");
  });
});
