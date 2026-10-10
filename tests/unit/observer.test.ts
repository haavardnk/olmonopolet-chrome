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
  const append = (className: string) => () => {
    const el = document.createElement("div");
    el.className = className;
    document.body.appendChild(el);
  };

  it.each([
    ["page", append("vmp-card"), 1],
    ["own", append("olmono-row"), 0],
    [
      "own text",
      () => {
        document.querySelector(".olmono-chip")!.textContent = "B";
      },
      0,
    ],
  ])("reacts to %s mutations", async (_label, mutate, calls) => {
    document.body.innerHTML = '<button class="olmono-chip">A</button>';
    const cb = vi.fn();
    const cleanup = observeMutations(cb, { debounce: 1 });
    mutate();
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
