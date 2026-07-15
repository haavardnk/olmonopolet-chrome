import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleCart } from "../../src/content/pages/cart";
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
  document.body.innerHTML = fixture("cart.html");
});

describe("handleCart", () => {
  it("injects a rating into the cart line item", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [{ vmp_id: 15616302, rating: 3.6 }] }),
      }),
    );

    await handleCart();

    const li = document.querySelector("ul.product-list > li")!;
    expect(li.querySelector(".untappd")).not.toBeNull();
    expect(li.querySelector(".stars")).not.toBeNull();
  });
});
