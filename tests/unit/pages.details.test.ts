import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleDetails } from "../../src/content/pages/details";
import { clearBeerCache } from "../../src/content/api/client";

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, "../fixtures", name), "utf-8");
}

beforeEach(() => {
  clearBeerCache();
  vi.restoreAllMocks();
  document.body.innerHTML = fixture("details.html");
  history.replaceState({}, "", "/Land/Norge/Buskerud/Lier/Disko-Agent/p/15616302");
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
    expect(document.querySelector(".product__category-name")?.textContent).toContain(
      "(IPA - American)",
    );
  });
});
