import { describe, it, expect, beforeEach, vi } from "vitest";
import { authFetch } from "../../src/content/api/authFetch";
import { getToken, setToken } from "../../src/shared/auth";

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.body.innerHTML = "";
});

describe("authFetch", () => {
  it("adds the Authorization header when a token exists", async () => {
    await setToken("tok");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 200, ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.olmonopolet.app/lists/");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Token tok");
  });

  it("adds the X-Api-Key header when a key is configured", async () => {
    vi.stubEnv("VITE_API_KEY", "secret");
    await setToken("tok");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 200, ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.olmonopolet.app/lists/");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("X-Api-Key")).toBe("secret");
  });

  it("omits the header when no token exists", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 200, ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("https://api.olmonopolet.app/lists/");

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("clears the token on a 401 response", async () => {
    await setToken("tok");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false } as Response),
    );

    await authFetch("https://api.olmonopolet.app/lists/");

    expect(await getToken()).toBeNull();
    expect(document.querySelector(".olmono-toast")).not.toBeNull();
  });
});
