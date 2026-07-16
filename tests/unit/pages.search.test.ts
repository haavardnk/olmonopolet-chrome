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
  vi.unstubAllGlobals();
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
    expect(
      card.querySelector("a.olmono-rating")?.getAttribute("href"),
    ).toContain("olmonopolet.app/products/15616302");
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

  it("removes the skeleton when no beer matches", async () => {
    mockBeers([]);

    await handleSearch();

    const card = document.querySelector("ul.product-list > li")!;
    expect(card.querySelector(".untappd")).toBeNull();
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
    const btn = card.querySelector(".product-tools .olmono-tasted-btn");
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
        label_hd_url: "https://untappd.example/label.jpg",
      },
    ]);

    await handleSearch();
    await new Promise((r) => setTimeout(r, 0));

    const card = document.querySelector("ul.product-list > li")!;
    const value = card.querySelector(".olmono-value");
    expect(value?.classList.contains("olmono-value--warning")).toBe(true);
    expect(value?.querySelector(".olmono-value-fill")).not.toBeNull();
    expect(card.querySelector("img")?.src).toContain(
      "untappd.example/label.jpg",
    );
  });
});
