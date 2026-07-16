import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBeers,
  getBeer,
  markTasted,
  getLists,
  addToList,
  removeFromList,
  clearBeerCache,
  clearListsCache,
} from "../../src/content/api/client";

beforeEach(() => {
  clearBeerCache();
  clearListsCache();
  vi.restoreAllMocks();
});

describe("getBeers", () => {
  it("batches ids and maps results by vmp_id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { vmp_id: 111, rating: 3.5 },
          { vmp_id: 222, rating: 4 },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const map = await getBeers([111, 222]);

    expect(map.get("111")?.rating).toBe(3.5);
    expect(map.get("222")?.rating).toBe(4);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("serves repeated ids from cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ vmp_id: 111, rating: 3.5 }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getBeers([111]);
    await getBeers([111]);

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("getBeer", () => {
  it("fetches a single beer by id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vmp_id: 111, rating: 3.6, ibu: 50 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const beer = await getBeer(111);

    expect(beer.ibu).toBe(50);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("retries once on failure then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ vmp_id: 111, rating: 3.6 }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const beer = await getBeer(111);

    expect(beer.rating).toBe(3.6);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("markTasted", () => {
  it("POSTs when marking tasted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);

    const ok = await markTasted(111, true);

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/beers/111/mark_tasted/");
    expect(init.method).toBe("POST");
  });

  it("DELETEs when unmarking tasted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await markTasted(111, false);

    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("returns false on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    expect(await markTasted(111, true)).toBe(false);
  });
});

describe("lists", () => {
  it("fetches and caches lists", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: "Handleliste", list_type: "shopping", product_ids: [] },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const lists = await getLists();
    await getLists();

    expect(lists[0].name).toBe("Handleliste");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("adds a product via POST items", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchMock);

    const ok = await addToList(1, "111");

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/lists/1/items/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ product_id: "111" });
  });

  it("removes a product via DELETE products", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await removeFromList(1, "111");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/lists/1/products/111/");
    expect(init.method).toBe("DELETE");
  });
});
