import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  compareVersions,
  loadConfig,
  parseConfig,
} from "../../src/content/core/config";
import { find, setAnchors } from "../../src/content/dom/anchors";

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

const VALID = {
  schema: 1,
  anchors: { productList: [{ css: "ol.results" }] },
};

beforeEach(() => {
  vi.unstubAllGlobals();
  setAnchors({});
  document.body.innerHTML = `<ol class="results"></ol>`;
});

describe("compareVersions", () => {
  it.each([
    ["0.5.0", "0.5.0", 0],
    ["0.5.1", "0.5.0", 1],
    ["0.4.10", "0.5", -1],
    ["1.0", "0.9.9", 1],
  ])("compares %s with %s", (a, b, expected) => {
    expect(compareVersions(a, b)).toBe(expected);
  });
});

describe("parseConfig", () => {
  it.each([
    ["non-object", "nope"],
    ["wrong schema", { ...VALID, schema: 2 }],
    ["newer minimum version", { ...VALID, minExtVersion: "0.6.0" }],
    ["missing anchors", { schema: 1 }],
  ])("rejects %s", (_label, data) => {
    expect(parseConfig(data, "0.5.0")).toBeNull();
  });

  it("returns valid overrides", () => {
    expect(parseConfig({ ...VALID, minExtVersion: "0.5.0" }, "0.5.0")).toEqual(
      VALID.anchors,
    );
  });

  it.each([
    ["invalid selector", { css: "ul[" }],
    ["non-string text", { css: "li", text: 3 }],
    ["fractional up", { css: "li", up: 1.5 }],
    ["excessive up", { css: "li", up: 99 }],
  ])("drops an anchor with %s", (_label, strategy) => {
    const parsed = parseConfig(
      { schema: 1, anchors: { productList: [strategy], unknown: [] } },
      "0.5.0",
    );
    expect(parsed).toEqual({});
  });
});

describe("loadConfig", () => {
  it("applies a fresh cached config without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "chrome",
      fakeChrome({ "olmono:config": { fetchedAt: Date.now(), data: VALID } }),
    );

    await loadConfig();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(find("productList")?.tagName).toBe("OL");
  });

  it.each([
    [200, VALID, "OL"],
    [404, null, undefined],
  ])(
    "refreshes a stale config (status %i)",
    async (status, data, expectedTag) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: status === 200,
          status,
          json: async () => data,
        }),
      );
      const chrome = fakeChrome({
        "olmono:config": { fetchedAt: 0, data: null },
      });
      vi.stubGlobal("chrome", chrome);

      await loadConfig();
      await vi.waitFor(() =>
        expect(
          (chrome.store["olmono:config"] as { fetchedAt: number }).fetchedAt,
        ).toBeGreaterThan(0),
      );

      expect((chrome.store["olmono:config"] as { data: unknown }).data).toEqual(
        data,
      );
      expect(find("productList")?.tagName).toBe(expectedTag);
    },
  );
});
