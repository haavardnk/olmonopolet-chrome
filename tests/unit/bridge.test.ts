import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Settings } from "../../src/shared/settings";
import { appliedSort } from "../../src/content/core/bridge";
import { handleSearch } from "../../src/content/pages/search";

const BEER_QUERY = ":relevance:mainCategory:øl";

const livePagination = {
  currentPage: 1,
  pageSize: 24,
  sort: "relevance",
  totalPages: 107,
  totalResults: 2552,
};

const liveProducts = [
  { code: "2", name: "Live 2", main_category: { code: "øl", name: "Øl" } },
  { code: "9", name: "Live 9", main_category: { code: "øl", name: "Øl" } },
];

function apiBeer(id: number): Record<string, unknown> {
  return {
    vmp_id: id,
    vmp_name: `Beer ${id}`,
    vmp_url: `https://www.vinmonopolet.no/Land/Norge/Beer-${id}/p/${id}`,
    main_category: "Øl",
    sub_category: "India pale ale",
    country: "Norge",
    price: 109.9,
    volume: 0.44,
    vmp_abv: 6.5,
    product_selection: "Basisutvalget",
    post_delivery: true,
    store_delivery: true,
  };
}

const apiCalls: URL[] = [];
let apiResponse: () => Response;
let stored: Partial<Settings> = {};
let token: string | undefined;

const storageSet = vi.fn(async (items: Record<string, unknown>) => {
  stored = items["olmono:settings"] as Partial<Settings>;
});

function vmpUrl(query: string): string {
  const params = new URLSearchParams({
    fields: "FULL",
    pageSize: "24",
    query,
    currentPage: "1",
    searchTypes: "product,content",
  });
  return `https://www.vinmonopolet.no/vmpws/v2/vmp/search?${params}`;
}

async function search(query: string): Promise<{
  products: { code: string; name: string }[];
  pagination: typeof livePagination;
}> {
  history.replaceState(null, "", `/search?q=${encodeURIComponent(query)}`);
  const res = await window.fetch(vmpUrl(query));
  const body = (await res.json()) as {
    productSearchResult: {
      products: { code: string; name: string }[];
      pagination: typeof livePagination;
    };
  };
  return body.productSearchResult;
}

function given(settings: Partial<Settings>, auth?: string): void {
  stored = settings;
  token = auth;
}

beforeAll(async () => {
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({
          [key]: key === "olmono:settings" ? stored : token,
        })),
        set: storageSet,
        remove: vi.fn(),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname === "/vmpws/v2/vmp/search") {
        return new Response(
          JSON.stringify({
            productSearchResult: {
              products: liveProducts,
              pagination: livePagination,
            },
          }),
          { headers: { "content-type": "application/json" } },
        );
      }
      apiCalls.push(url);
      return apiResponse();
    }),
  );
  await import("../../src/content/main/index");
  const { listenForSearch } = await import("../../src/content/core/bridge");
  listenForSearch();
});

beforeEach(() => {
  document.body.innerHTML = readFileSync(
    resolve(import.meta.dirname, "../fixtures/search.html"),
    "utf-8",
  );
  apiCalls.length = 0;
  storageSet.mockClear();
  apiResponse = () =>
    new Response(
      JSON.stringify({
        count: 30,
        next: null,
        results: [apiBeer(1), apiBeer(2)],
      }),
    );
});

describe("olmonopolet sorted search", () => {
  it.each([
    [false, undefined, null],
    [true, "tok", "false"],
  ])(
    "replaces vinmonopolet products in sorted order (hideTasted %s)",
    async (hideTasted, auth, userTasted) => {
      given({ sort: "-rating", hideTasted }, auth);

      const result = await search(BEER_QUERY);

      expect(result.products.map((p) => [p.code, p.name])).toEqual([
        ["1", "Beer 1"],
        ["2", "Live 2"],
      ]);
      expect(result.pagination).toEqual({
        ...livePagination,
        totalResults: 30,
        totalPages: 2,
      });
      const params = apiCalls[0].searchParams;
      expect(params.get("vmp_query")).toBe(BEER_QUERY);
      expect(params.get("ordering")).toBe("-rating,vmp_name");
      expect(params.get("page")).toBe("2");
      expect(params.get("page_size")).toBe("24");
      expect(params.get("user_tasted")).toBe(userTasted);
      expect(appliedSort()).toEqual({
        sort: "-rating",
        hideTasted,
        failed: false,
        ignored: [],
      });
    },
  );

  it.each([
    [{ sort: "vmp" }, BEER_QUERY, false],
    [{ sort: "-rating" }, ":relevance:mainCategory:rødvin", false],
    [{ sort: "-rating" }, ":price-asc:mainCategory:øl", true],
  ] as const)(
    "keeps vinmonopolet products for %j on %s",
    async (settings, query, resetsSort) => {
      given(settings);

      const result = await search(query);

      expect(result.products.map((p) => p.code)).toEqual(["2", "9"]);
      expect(apiCalls).toHaveLength(0);
      expect(storageSet.mock.calls.length > 0).toBe(resetsSort);
      if (resetsSort) expect(stored.sort).toBe("vmp");
    },
  );

  it("falls back to vinmonopolet order and offers a retry when sorting fails", async () => {
    given({ sort: "-rating" });
    apiResponse = () => new Response("", { status: 500 });

    const result = await search(BEER_QUERY);

    expect(result.products.map((p) => p.code)).toEqual(["2", "9"]);
    expect(appliedSort()?.failed).toBe(true);

    apiResponse = () => new Response(JSON.stringify({ results: [] }));
    await handleSearch();
    const note = document.querySelector(".olmono-toolbar-note");
    expect(note?.textContent).toBe("Kunne ikke sortere. Prøv igjen");
    expect(note?.querySelector("button")).not.toBeNull();
  });

  it.each([
    [{ sort: "-rating" }, BEER_QUERY, { sort: "-value_score" }, "reload"],
    [{ sort: "-rating" }, BEER_QUERY, { hideTasted: true }, "reload"],
    [{ sort: "-rating" }, BEER_QUERY, {}, null],
    [{ sort: "vmp" }, BEER_QUERY, { hideTasted: true }, null],
    [
      { sort: "vmp" },
      ":price-asc:mainCategory:øl",
      { sort: "-rating" },
      `/search?q=${encodeURIComponent(BEER_QUERY)}`,
    ],
  ] as const)(
    "after %j on %s, changing %j navigates to %s",
    async (initial, query, change, expected) => {
      given(initial, "tok");
      await search(query);
      const reload = vi.spyOn(location, "reload").mockImplementation(() => {});
      const assign = vi.spyOn(location, "assign").mockImplementation(() => {});
      given({ ...initial, ...change }, "tok");

      await handleSearch();

      const navigated =
        reload.mock.calls.length > 0
          ? "reload"
          : assign.mock.calls.length > 0
            ? String(assign.mock.calls[0][0]).replace(location.origin, "")
            : null;
      expect(navigated).toBe(expected);
      reload.mockRestore();
      assign.mockRestore();
    },
  );
});
