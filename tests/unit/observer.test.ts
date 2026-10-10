import { describe, it, expect, vi } from "vitest";
import {
  retryUntil,
  observeMutations,
  onRouteChange,
} from "../../src/content/core/observer";

describe("retryUntil", () => {
  it("resolves true once fn becomes true", async () => {
    let n = 0;
    const ok = await retryUntil(() => ++n >= 3, { attempts: 5, delay: 1 });
    expect(ok).toBe(true);
  });

  it("resolves false when fn never becomes true", async () => {
    const ok = await retryUntil(() => false, { attempts: 3, delay: 1 });
    expect(ok).toBe(false);
  });
});

describe("observeMutations", () => {
  it.each([
    ["page", "vmp-card", 1],
    ["own", "olmono-row", 0],
  ])("reacts to %s mutations", async (_label, className, calls) => {
    document.body.innerHTML = "";
    const cb = vi.fn();
    const cleanup = observeMutations(cb, { debounce: 1 });
    const el = document.createElement("div");
    el.className = className;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 20));
    expect(cb).toHaveBeenCalledTimes(calls);
    cleanup();
  });
});

describe("onRouteChange", () => {
  it("fires on pushState navigation", () => {
    const cb = vi.fn();
    const cleanup = onRouteChange(cb);
    history.pushState({}, "", "/new-path");
    expect(cb).toHaveBeenCalledWith(expect.stringContaining("/new-path"));
    cleanup();
  });
});
