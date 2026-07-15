import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getProductId,
  getProductIdFromUrl,
  findProductCards,
  isBeer,
  getInfoContainer,
} from "../../src/content/dom/product";

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, "../fixtures", name), "utf-8");
}

describe("product (search fixture)", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture("search.html");
  });

  it("finds product cards", () => {
    expect(findProductCards()).toHaveLength(1);
  });

  it("extracts product id from the product link", () => {
    expect(getProductId(findProductCards()[0])).toBe("15616302");
  });

  it("detects beer via aria-label even when category is a subcategory", () => {
    expect(isBeer(findProductCards()[0])).toBe(true);
  });

  it("info container holds the product name", () => {
    const c = getInfoContainer(findProductCards()[0]);
    expect(c.querySelector(".product__name")).not.toBeNull();
  });
});

describe("product (cart fixture)", () => {
  beforeEach(() => {
    document.body.innerHTML = fixture("cart.html");
  });

  it("extracts id via href fallback when no product__name/aria-label", () => {
    expect(getProductId(findProductCards()[0])).toBe("15616302");
  });

  it("info container walks up from the h3 name", () => {
    const c = getInfoContainer(findProductCards()[0]);
    expect(c.querySelector("h3")).not.toBeNull();
  });
});

describe("getProductIdFromUrl", () => {
  it("parses /p/{id}", () => {
    expect(getProductIdFromUrl("/Land/Norge/Disko/p/15616302")).toBe("15616302");
  });

  it("returns null when absent", () => {
    expect(getProductIdFromUrl("/search?q=ipa")).toBeNull();
  });
});
