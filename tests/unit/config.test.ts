import { describe, it, expect, beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  compareVersions,
  loadConfig,
  parseConfig,
} from "../../src/content/core/config";
import { find, setAnchors } from "../../src/content/dom/anchors";

interface StoredConfig {
  fetchedAt: number;
  data: unknown;
}

async function storedConfig(): Promise<StoredConfig | undefined> {
  const stored = await fakeBrowser.storage.local.get("olmono:config");
  return stored["olmono:config"] as StoredConfig | undefined;
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
    await fakeBrowser.storage.local.set({
      "olmono:config": { fetchedAt: Date.now(), data: VALID },
    });

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
      await fakeBrowser.storage.local.set({
        "olmono:config": { fetchedAt: 0, data: null },
      });

      await loadConfig();
      await vi.waitFor(async () =>
        expect((await storedConfig())?.fetchedAt).toBeGreaterThan(0),
      );

      expect((await storedConfig())?.data).toEqual(data);
      expect(find("productList")?.tagName).toBe(expectedTag);
    },
  );
});
