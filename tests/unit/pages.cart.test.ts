import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleCart } from "../../src/content/pages/cart";
import { clearBeerCache } from "../../src/content/api/client";
import { clearListsCache } from "../../src/content/api/lists";

function fixture(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../fixtures", name),
    "utf-8",
  );
}

beforeEach(() => {
  clearBeerCache();
  clearListsCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = fixture("cart.html");
});

function mockBeers(results: unknown[]): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) }),
  );
}

function stubConnected(): void {
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({
          [key]: key === "olmono:settings" ? {} : "tok",
        })),
        set: vi.fn(),
        remove: vi.fn(),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  });
}

describe("handleCart", () => {
  it("places the rating row with units between price and quantity", async () => {
    mockBeers([
      {
        vmp_id: 15616302,
        rating: 3.6,
        alcohol_units: 2.8,
        price_per_alcohol_unit: 29,
      },
    ]);

    await handleCart();

    const li = document.querySelector("ul.product-list > li")!;
    const row = li.querySelector(".olmono-row")!;
    expect(row.querySelector(".olmono-star")).not.toBeNull();
    expect(row.querySelector(".olmono-units")?.textContent).toBe(
      "2,8 enheter · 29 kr/enhet",
    );
    expect(row.nextElementSibling?.querySelector("input")).not.toBeNull();
    expect(document.querySelector(".olmono-summary")?.textContent).toBe(
      "Ølmonopolet · 1 øl · snittvurdering 3,60",
    );
  });

  it("adds tasted and list buttons beside the remove button when connected", async () => {
    stubConnected();
    mockBeers([{ vmp_id: 15616302, rating: 3.6, user_tasted: true }]);

    await handleCart();
    await handleCart();

    const li = document.querySelector("ul.product-list > li")!;
    const tools = li.querySelectorAll(".olmono-cart-tools");
    expect(tools).toHaveLength(1);
    expect(tools[0].nextElementSibling?.getAttribute("aria-label")).toBe(
      "Fjern produkt fra handlekurven",
    );
    expect(
      [...tools[0].children].map((el) => el.getAttribute("aria-label")),
    ).toEqual(["Smakt", "Legg til i Ølmonopolet-liste"]);
  });
});
