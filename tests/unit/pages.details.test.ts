import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleDetails } from "../../src/content/pages/details";
import { clearBeerCache } from "../../src/content/api/client";

function fixture(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../fixtures", name),
    "utf-8",
  );
}

beforeEach(() => {
  clearBeerCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = fixture("details.html");
  history.replaceState(
    {},
    "",
    "/Land/Norge/Buskerud/Lier/Disko-Agent/p/15616302",
  );
});

describe("handleDetails", () => {
  it("injects the rating block into product-details-main", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vmp_id: 15616302,
          rating: 3.606,
          checkins: 1693,
          ibu: 50,
          style: "IPA - American",
          untpd_updated: "2026-07-14T22:39:32Z",
          badges: [],
        }),
      }),
    );

    await handleDetails();

    const block = document.querySelector(".product-details-main .untappd");
    expect(block).not.toBeNull();
    expect(block?.querySelector(".stars")).not.toBeNull();
    expect(block?.querySelector("a")?.getAttribute("href")).toContain(
      "olmonopolet.app/products/15616302",
    );
  });

  it("injects IBU into the details list and style into the category", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vmp_id: 15616302,
          rating: 3.6,
          checkins: 1000,
          ibu: 50,
          style: "IPA - American",
          untpd_updated: "2026-07-14T22:39:32Z",
        }),
      }),
    );

    await handleDetails();

    const ibuInjected = [...document.querySelectorAll(".details-list li")].some(
      (li) => li.querySelector("span")?.textContent === "Ibu",
    );
    expect(ibuInjected).toBe(true);
    expect(
      document.querySelector(".product__category-name")?.textContent,
    ).toContain("(IPA - American)");

    const varetype = [...document.querySelectorAll(".details-list li")].find(
      (li) => li.querySelector("span")?.textContent === "Varetype",
    );
    expect(varetype?.querySelectorAll("span")[1]?.textContent).toBe(
      "Øl - India pale ale (IPA - American)",
    );
  });

  it("injects alcohol units next to Alkohol and price per unit after kr/l", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vmp_id: 15616302,
          rating: 3.6,
          checkins: 1000,
          alcohol_units: 2.75,
          price_per_alcohol_unit: 38.96,
        }),
      }),
    );

    await handleDetails();

    const units = [...document.querySelectorAll(".characteristics li")].find(
      (li) => li.querySelector("strong")?.textContent === "Alkoholenheter",
    );
    expect(units?.querySelector("span")?.textContent).toBe("2,8");

    const ppau = document.querySelector(
      ".volume-and-cost_per_unit .olmono-ppau",
    );
    expect(ppau?.textContent).toBe("39 kr/alkoholenhet");
  });

  it("fills the empty product image with the HD label", async () => {
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vmp_id: 15616302,
          rating: 3.6,
          label_sm_url: "https://untappd.example/sm.jpg",
          label_hd_url: "https://untappd.example/hd.jpg",
        }),
      }),
    );

    await handleDetails();
    await new Promise((r) => setTimeout(r, 0));

    const img = document.querySelector<HTMLImageElement>('img[alt^="Bilde"]');
    expect(img?.src).toContain("untappd.example/hd.jpg");
  });

  it("shows a tasted toggle when connected", async () => {
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: "tok" })),
          set: vi.fn(),
          remove: vi.fn(),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          vmp_id: 15616302,
          rating: 3.6,
          user_tasted: false,
        }),
      }),
    );

    await handleDetails();

    const btn = document.querySelector(".product-tools .olmono-tasted-btn");
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-label")).toBe("Marker som smakt");
  });
});
