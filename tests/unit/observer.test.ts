import { describe, it, expect, vi } from "vitest";
import {
  retryUntil,
  waitFor,
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

describe("waitFor", () => {
  it("resolves immediately when the element exists", async () => {
    document.body.innerHTML = `<div class="x"></div>`;
    expect(await waitFor(".x", { timeout: 50 })).not.toBeNull();
  });

  it("resolves when the element appears later", async () => {
    document.body.innerHTML = "";
    const pending = waitFor(".later", { timeout: 500 });
    setTimeout(() => {
      document.body.innerHTML = `<div class="later"></div>`;
    }, 10);
    expect(await pending).not.toBeNull();
  });

  it("resolves null on timeout", async () => {
    document.body.innerHTML = "";
    expect(await waitFor(".never", { timeout: 20 })).toBeNull();
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
