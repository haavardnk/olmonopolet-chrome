import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleExternalMessage } from "../../src/background/index";

function fakeChrome(token?: string) {
  const store: Record<string, unknown> = token ? { "olmono:token": token } : {};
  return {
    store,
    runtime: {},
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
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
}

const ORIGIN = "https://olmonopolet.app";

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("handleExternalMessage", () => {
  it("rejects messages from other origins", async () => {
    vi.stubGlobal("chrome", fakeChrome("tok"));
    const res = await handleExternalMessage(
      { type: "olmono-auth-token", token: "evil" },
      "https://evil.example",
    );
    expect(res).toEqual({ ok: false });
  });

  it("reports connection status", async () => {
    vi.stubGlobal("chrome", fakeChrome("tok"));
    const res = await handleExternalMessage(
      { type: "olmono-auth-status" },
      ORIGIN,
    );
    expect(res).toEqual({ installed: true, connected: true });
  });

  it("stores a pushed token", async () => {
    const chrome = fakeChrome();
    vi.stubGlobal("chrome", chrome);
    const res = await handleExternalMessage(
      { type: "olmono-auth-token", token: "newtok" },
      ORIGIN,
    );
    expect(res).toEqual({ ok: true });
    expect(chrome.store["olmono:token"]).toBe("newtok");
  });

  it("clears the token on logout", async () => {
    const chrome = fakeChrome("tok");
    vi.stubGlobal("chrome", chrome);
    const res = await handleExternalMessage(
      { type: "olmono-auth-logout" },
      ORIGIN,
    );
    expect(res).toEqual({ ok: true });
    expect(chrome.store["olmono:token"]).toBeUndefined();
  });
});
