import { describe, it, expect, beforeEach } from "vitest";
import {
  injectRating,
  injectSkeleton,
  removeSkeleton,
  alreadyInjected,
} from "../../src/content/core/inject";

function skeleton(): HTMLElement {
  const el = document.createElement("div");
  el.classList.add("olmono-skeleton");
  return el;
}

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

  it("replaces a skeleton with the real node", () => {
    const c = document.querySelector(".c")!;
    injectSkeleton(c, "111", skeleton());
    expect(c.children).toHaveLength(1);

    const real = document.createElement("div");
    real.textContent = "real";
    expect(injectRating(c, "111", real)).toBe(true);
    expect(c.children).toHaveLength(1);
    expect(c.firstElementChild?.textContent).toBe("real");
    expect(c.firstElementChild?.classList.contains("olmono-skeleton")).toBe(
      false,
    );
  });

  it("does not inject a second skeleton for the same id", () => {
    const c = document.querySelector(".c")!;
    injectSkeleton(c, "111", skeleton());
    injectSkeleton(c, "111", skeleton());
    expect(c.children).toHaveLength(1);
  });

  it("removes a lingering skeleton", () => {
    const c = document.querySelector(".c")!;
    injectSkeleton(c, "111", skeleton());
    removeSkeleton(c, "111");
    expect(c.children).toHaveLength(0);
  });

  it("keeps a real node when removeSkeleton is called", () => {
    const c = document.querySelector(".c")!;
    injectRating(c, "111", document.createElement("div"));
    removeSkeleton(c, "111");
    expect(c.children).toHaveLength(1);
  });
});
