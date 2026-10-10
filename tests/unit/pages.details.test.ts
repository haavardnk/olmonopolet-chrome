import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleDetails } from "../../src/content/pages/details";
import { clearBeerCache } from "../../src/content/api/client";

function fixture(name: string): string {
  return readFileSync(
    resolve(import.meta.dirname, "../fixtures", name),
    "utf-8",
  );
}

function mockBeer(beer: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => beer }),
  );
}

const PATH = "/Land/Norge/Buskerud/Lier/Disko-Agent/p/15616302";

const FULL_BEER = {
  vmp_id: 15616302,
  rating: 3.606,
  checkins: 1693,
  ibu: 50,
  style: "IPA - American",
  alcohol_units: 2.75,
  price_per_alcohol_unit: 38.96,
  value_score: 8,
  untpd_updated: "2026-07-14T12:00:00Z",
  badges: [{ text: "Ny" }],
};

beforeEach(() => {
  clearBeerCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = fixture("details.html");
  history.replaceState({}, "", PATH);
});

function facts(): Record<string, string> {
  return Object.fromEntries(
    [...document.querySelectorAll(".olmono-facts > div")].map((row) => [
      row.querySelector("dt")?.textContent ?? "",
      row.querySelector("dd")?.textContent ?? "",
    ]),
  );
}

describe("handleDetails", () => {
  it("shows a skeleton in the name block, then the rating", async () => {
    let resolveBeer!: (value: unknown) => void;
    const pending = new Promise((r) => {
      resolveBeer = r;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => pending),
    );

    const done = handleDetails();
    await new Promise((r) => setTimeout(r, 0));

    const nameBlock = document.querySelector("div.drVuAFYe")!;
    expect(nameBlock.querySelector(".olmono-skeleton")).not.toBeNull();

    resolveBeer({ ok: true, json: async () => FULL_BEER });
    await done;

    const hero = nameBlock.querySelector(".olmono-row--lg");
    expect(nameBlock.querySelector(".olmono-skeleton")).toBeNull();
    expect(hero?.querySelector(".olmono-star")).not.toBeNull();
    expect(hero?.textContent).toContain("3,61");
    expect(hero?.textContent).toContain("1\u00a0693 vurderinger");
  });

  it("renders the Ølmonopolet panel next to the sustainability card", async () => {
    mockBeer(FULL_BEER);

    await handleDetails();

    const panel = document.querySelector(".GfbhJELI > .olmono-panel");
    expect(panel?.querySelector("h5")?.textContent).toBe("Ølmonopolet");
    expect(facts()).toEqual({
      Stil: "IPA - American",
      IBU: "50",
      Alkoholenheter: "2,8",
      "Pris per alkoholenhet": "39 kr",
      "Verdi for pengene": "8,0 av 20",
    });
    expect(panel?.querySelector(".olmono-badge")?.textContent).toBe("Ny");
    expect(panel?.querySelector(".olmono-panel-footer")?.textContent).toBe(
      "Oppdatert 14.07.2026 · Se på Ølmonopolet",
    );
    expect(document.body.innerHTML.toLowerCase()).not.toContain("untappd");
  });

  it("leaves Vinmonopolet's own text untouched", async () => {
    mockBeer(FULL_BEER);
    const category = document.querySelector("p.AVg39DO6")!.textContent;
    const factsHtml = document.querySelector("ul.A86PRlFM")!.innerHTML;

    await handleDetails();

    expect(document.querySelector("p.AVg39DO6")!.textContent).toBe(category);
    expect(document.querySelector("ul.A86PRlFM")!.innerHTML).toBe(factsHtml);
  });

  it.each([
    ["div.GfbhJELI", "div.dDnT0pW8 > .olmono-panel-wrap > .olmono-panel"],
    ["div.dDnT0pW8", "hr.QfywKVsh + .olmono-panel + ul.A86PRlFM"],
  ])(
    "falls back when %s is missing",
    async (removed: string, expected: string) => {
      document.querySelector(removed)!.remove();
      mockBeer(FULL_BEER);

      await handleDetails();

      expect(document.querySelector(expected)).not.toBeNull();
      expect(document.querySelectorAll(".olmono-panel")).toHaveLength(1);
    },
  );

  it.each([
    [404, "Ikke på Ølmonopolet ennå"],
    [500, "Kunne ikke laste vurdering"],
  ])("shows a message on HTTP %d", async (code, message) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: code }),
    );

    await handleDetails();

    expect(document.querySelector(".olmono-rating-empty")?.textContent).toBe(
      message,
    );
    expect(document.querySelector(".olmono-panel")).toBeNull();
    expect(document.querySelector(".olmono-skeleton")).toBeNull();
  });

  it("re-renders when navigating to another product in the same DOM", async () => {
    mockBeer(FULL_BEER);
    await handleDetails();

    history.replaceState({}, "", "/Land/Norge/Annen/p/12345");
    mockBeer({ ...FULL_BEER, vmp_id: 12345, rating: 4.1 });
    await handleDetails();

    const rows = document.querySelectorAll("div.drVuAFYe > .olmono-row");
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute("data-olmono")).toBe("12345");
    expect(rows[0].textContent).toContain("4,10");
    const panels = document.querySelectorAll(".olmono-panel");
    expect(panels).toHaveLength(1);
    expect(panels[0].getAttribute("data-olmono")).toBe("12345");
  });

  it("does nothing twice for the same product", async () => {
    mockBeer(FULL_BEER);

    await handleDetails();
    await handleDetails();

    expect(
      document.querySelectorAll("div.drVuAFYe > .olmono-row"),
    ).toHaveLength(1);
    expect(document.querySelectorAll(".olmono-panel")).toHaveLength(1);
  });

  it("fills the empty product image with the HD label", async () => {
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 154;
      naturalHeight = 377;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({
            [key]:
              key === "olmono:settings"
                ? { labelImage: "fill-if-missing" }
                : undefined,
          })),
          set: vi.fn(),
          remove: vi.fn(),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    mockBeer({
      vmp_id: 15616302,
      rating: 3.6,
      label_sm_url: "https://labels.example/sm.jpg",
      label_hd_url: "https://labels.example/hd.jpg",
    });

    await handleDetails();
    await new Promise((r) => setTimeout(r, 0));

    const img = document.querySelector<HTMLImageElement>('img[alt^="Bilde"]');
    expect(img?.src).toContain("labels.example/hd.jpg");
  });

  it("shows a tasted toggle keyed to the product when connected", async () => {
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: "tok" })),
          set: vi.fn(),
          remove: vi.fn(),
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    });
    mockBeer({ vmp_id: 15616302, rating: 3.6, user_tasted: false });

    await handleDetails();

    const btn = document.querySelector("div.sMnNlv3t > .olmono-tasted-btn");
    expect(btn?.getAttribute("aria-label")).toBe("Marker som smakt");
    expect(btn?.getAttribute("data-olmono")).toBe("15616302");
  });
});
