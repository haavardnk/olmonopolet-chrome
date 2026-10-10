import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  find,
  findAll,
  missing,
  setAnchors,
  waitForAnchor,
} from "../../src/content/dom/anchors";

function fixture(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../fixtures", name),
    "utf-8",
  );
}

beforeEach(() => {
  setAnchors({});
  document.body.innerHTML = "";
});

afterEach(() => {
  setAnchors({});
});

describe("anchors", () => {
  it.each([
    ["search.html", ["productList", "productCard", "productLink", "category"]],
    ["search.html", ["productImage", "productPrice", "tools", "sortSelect"]],
    ["details.html", ["detailPage", "category", "tools", "productImage"]],
    ["details.html", ["detailBuy", "detailHero"]],
  ] as const)("resolves %s anchors %j", (file, names) => {
    document.body.innerHTML = fixture(file);
    expect(missing([...names])).toEqual([]);
  });

  it("resolves text strategies and climbs to the ancestor", () => {
    document.body.innerHTML = fixture("details.html");
    expect(find("detailHero")?.querySelector("h1")).not.toBeNull();
    expect(find("detailBuy")?.classList.contains("jznNJ0wW")).toBe(true);
  });

  it("resolves tools as the parent of the list button", () => {
    document.body.innerHTML = fixture("search.html");
    expect(find("tools")?.classList.contains("sMnNlv3t")).toBe(true);
  });

  it("falls through to later strategies", () => {
    document.body.innerHTML = `<div class="b"></div>`;
    setAnchors({ productList: [{ css: ".a" }, { css: ".b" }] });
    expect(find("productList")?.className).toBe("b");
  });

  it("skips strategies with invalid selectors", () => {
    document.body.innerHTML = `<ul class="product-list"><li></li><li></li></ul>`;
    setAnchors({ productCard: [{ css: "li[" }, { css: "ul > li" }] });
    expect(findAll("productCard")).toHaveLength(2);
  });

  it("scopes lookups to the given root", () => {
    document.body.innerHTML = fixture("search.html");
    const card = findAll("productCard")[0];
    expect(find("sortSelect", card)).toBeNull();
  });
});

describe("waitForAnchor", () => {
  it("resolves when the anchor appears", async () => {
    const pending = waitForAnchor("productList", { timeout: 500 });
    setTimeout(() => {
      document.body.innerHTML = `<ul class="product-list"></ul>`;
    }, 5);
    expect(await pending).not.toBeNull();
  });

  it("resolves null on timeout", async () => {
    expect(await waitForAnchor("productList", { timeout: 10 })).toBeNull();
  });

  it("resolves null when aborted", async () => {
    const controller = new AbortController();
    const pending = waitForAnchor("productList", {
      timeout: 5000,
      signal: controller.signal,
    });
    controller.abort();
    expect(await pending).toBeNull();
  });
});
