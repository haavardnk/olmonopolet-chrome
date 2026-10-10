import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  checkHealth,
  recordHealth,
  resetHealth,
  SETTLE_DELAY,
} from "../../src/content/core/health";
import { getHealth } from "../../src/shared/health";
import { setSettings } from "../../src/shared/settings";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetHealth();
  fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(fakeBrowser.runtime.getManifest).mockReturnValue({
    manifest_version: 3,
    name: "Ølmonopolet",
    version: "0.5.0",
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("recordHealth", () => {
  it("stores the status and reports misses once per day", async () => {
    await recordHealth("search", ["sortSelect"]);
    resetHealth();
    await recordHealth("search", ["sortSelect"]);

    const health = await getHealth();
    expect(health.search?.missing).toEqual(["sortSelect"]);
    expect(health.search?.version).toBe("0.5.0");
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
    await setSettings({ reports: false });

    await recordHealth("details", ["detailHero"]);

    expect((await getHealth()).details?.missing).toEqual(["detailHero"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not report a healthy page", async () => {
    await recordHealth("cart", []);

    expect((await getHealth()).cart?.missing).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checkHealth", () => {
  it("records a healthy page immediately", async () => {
    checkHealth("search", () => []);
    await vi.waitFor(async () =>
      expect((await getHealth()).search?.missing).toEqual([]),
    );
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
    expect(await getHealth()).toEqual({});

    await vi.advanceTimersByTimeAsync(SETTLE_DELAY);

    expect(evaluate).toHaveBeenCalledTimes(3);
    expect((await getHealth()).search?.missing).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records misses still present after the settle delay", async () => {
    vi.useFakeTimers();

    checkHealth("details", () => ["detailHero"]);
    await vi.advanceTimersByTimeAsync(SETTLE_DELAY);

    expect((await getHealth()).details?.missing).toEqual(["detailHero"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
