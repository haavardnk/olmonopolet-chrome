import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBeers,
  getBeer,
  clearBeerCache,
} from "../../src/content/api/client";

beforeEach(() => {
  clearBeerCache();
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
