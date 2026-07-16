import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getToken,
  setToken,
  clearToken,
  isConnected,
  onTokenChange,
} from "../../src/shared/auth";

type Listener = (
  changes: Record<string, { newValue?: unknown }>,
  area: string,
) => void;

function fakeChrome() {
  const store: Record<string, unknown> = {};
  const listeners: Listener[] = [];
  return {
    store,
    listeners,
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: vi.fn(async (key: string) => {
          delete store[key];
        }),
      },
      onChanged: {
        addListener: (cb: Listener) => listeners.push(cb),
        removeListener: (cb: Listener) => {
          const i = listeners.indexOf(cb);
          if (i >= 0) listeners.splice(i, 1);
        },
      },
    },
  };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("auth token store", () => {
  it("returns null when chrome is unavailable", async () => {
    expect(await getToken()).toBeNull();
    expect(await isConnected()).toBe(false);
  });

  it("stores, reads and clears the token", async () => {
    vi.stubGlobal("chrome", fakeChrome());
    await setToken("abc123");
    expect(await getToken()).toBe("abc123");
    expect(await isConnected()).toBe(true);
    await clearToken();
    expect(await getToken()).toBeNull();
  });

  it("notifies subscribers on token change", () => {
    const chrome = fakeChrome();
    vi.stubGlobal("chrome", chrome);
    const cb = vi.fn();
    onTokenChange(cb);
    chrome.listeners.forEach((l) =>
      l({ "olmono:token": { newValue: "xyz" } }, "local"),
    );
    expect(cb).toHaveBeenCalledWith("xyz");
  });
});
