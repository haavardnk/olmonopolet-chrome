import { describe, it, expect, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  getToken,
  setToken,
  clearToken,
  isConnected,
  onTokenChange,
} from "../../src/shared/auth";

describe("auth token store", () => {
  it("returns null without a stored token", async () => {
    expect(await getToken()).toBeNull();
    expect(await isConnected()).toBe(false);
  });

  it("stores, reads and clears the token", async () => {
    await setToken("abc123");
    expect(await getToken()).toBe("abc123");
    expect(await isConnected()).toBe(true);
    await clearToken();
    expect(await getToken()).toBeNull();
  });

  it("notifies subscribers on token change", async () => {
    const cb = vi.fn();
    onTokenChange(cb);
    await fakeBrowser.storage.local.set({ "olmono:token": "xyz" });
    expect(cb).toHaveBeenCalledWith("xyz");
  });
});
