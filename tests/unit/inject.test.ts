import { describe, it, expect, beforeEach } from "vitest";
import { injectRating, alreadyInjected } from "../../src/content/core/inject";

beforeEach(() => {
  document.body.innerHTML = `<div class="c"></div>`;
});

describe("inject", () => {
  it("injects once and marks the node with the id", () => {
    const c = document.querySelector(".c")!;
    expect(injectRating(c, "111", document.createElement("div"))).toBe(true);
    expect(alreadyInjected(c, "111")).toBe(true);
  });

  it("does not double-inject the same id", () => {
    const c = document.querySelector(".c")!;
    expect(injectRating(c, "111", document.createElement("div"))).toBe(true);
    expect(injectRating(c, "111", document.createElement("div"))).toBe(false);
    expect(c.children).toHaveLength(1);
  });
});
