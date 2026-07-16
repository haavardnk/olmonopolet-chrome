import { describe, it, expect, beforeEach, vi } from "vitest";
import { authFetch } from "../../src/content/api/authFetch";

function fakeChrome(token?: string) {
  const store: Record<string, unknown> = token ? { "olmono:token": token } : {};
  return {
    store,
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

beforeEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("authFetch", () => {
  it("adds the Authorization header when a token exists", async () => {
    vi.stubGlobal("chrome", fakeChrome("tok"));
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 200, ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.olmonopolet.app/lists/");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Token tok");
  });

  it("omits the header when no token exists", async () => {
    vi.stubGlobal("chrome", fakeChrome());
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 200, ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.olmonopolet.app/lists/");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("clears the token on a 401 response", async () => {
    const chrome = fakeChrome("tok");
    vi.stubGlobal("chrome", chrome);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false } as Response),
    );

    await authFetch("https://api.olmonopolet.app/lists/");

    expect(chrome.store["olmono:token"]).toBeUndefined();
    expect(document.querySelector(".olmono-toast")).not.toBeNull();
  });
});
