import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkHealth,
  recordHealth,
  resetHealth,
  SETTLE_DELAY,
} from "../../src/content/core/health";
import type { HealthState } from "../../src/shared/health";

function fakeChrome(store: Record<string, unknown> = {}) {
  return {
    store,
    runtime: { getManifest: () => ({ version: "0.5.0" }) },
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
    },
  };
}

let chrome: ReturnType<typeof fakeChrome>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetHealth();
  chrome = fakeChrome();
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
  vi.stubGlobal("chrome", chrome);
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function health(): HealthState {
  return chrome.store["olmono:health"] as HealthState;
}

describe("recordHealth", () => {
  it("stores the status and reports misses once per day", async () => {
    await recordHealth("search", ["sortSelect"]);
    resetHealth();
    await recordHealth("search", ["sortSelect"]);

    expect(health().search?.missing).toEqual(["sortSelect"]);
    expect(health().search?.version).toBe("0.5.0");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/extension/reports/");
    expect(JSON.parse(init.body)).toEqual({
      version: "0.5.0",
      page: "search",
      anchors: ["sortSelect"],
    });
  });

  it("does not report when reports are disabled", async () => {
    chrome.store["olmono:settings"] = { reports: false };

    await recordHealth("details", ["detailHero"]);

    expect(health().details?.missing).toEqual(["detailHero"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not report a healthy page", async () => {
    await recordHealth("cart", []);

    expect(health().cart?.missing).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checkHealth", () => {
  it("records a healthy page immediately", async () => {
    checkHealth("search", () => []);
    await vi.waitFor(() => expect(health().search?.missing).toEqual([]));
  });

  it("only records misses that persist past the settle delay", async () => {
    vi.useFakeTimers();
    const evaluate = vi
      .fn<() => ["tools"] | []>()
      .mockReturnValueOnce(["tools"])
      .mockReturnValueOnce(["tools"])
      .mockReturnValue([]);

    checkHealth("search", evaluate);
    checkHealth("search", evaluate);
    expect(chrome.store["olmono:health"]).toBeUndefined();

    await vi.advanceTimersByTimeAsync(SETTLE_DELAY);

    expect(evaluate).toHaveBeenCalledTimes(3);
    expect(health().search?.missing).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records misses still present after the settle delay", async () => {
    vi.useFakeTimers();

    checkHealth("details", () => ["detailHero"]);
    await vi.advanceTimersByTimeAsync(SETTLE_DELAY);

    expect(health().details?.missing).toEqual(["detailHero"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
