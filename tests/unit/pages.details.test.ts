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

function facts(scope = ".olmono-panel"): Record<string, string> {
  return Object.fromEntries(
    [...document.querySelectorAll(`${scope} .olmono-facts > div`)].map(
      (row) => [
        row.querySelector("dt")?.textContent ?? "",
        row.querySelector("dd")?.textContent ?? "",
      ],
    ),
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

  it("renders the Ølmonopolet band between the hero and the lower section", async () => {
    mockBeer(FULL_BEER);

    await handleDetails();

    const panel = document.querySelector("div.SeFRvCFQ > div.olmono-panel");
    expect(panel?.previousElementSibling?.querySelector("h1")).not.toBeNull();
    expect(panel?.nextElementSibling?.classList.contains("gSzVyerq")).toBe(
      true,
    );
    expect(panel?.querySelector("h2")?.textContent).toBe("Ølmonopolet");
    expect(facts()).toEqual({
      Stil: "IPA - American",
      IBU: "50",
      Alkoholenheter: "2,8",
      "Pris per alkoholenhet": "39 kr",
      "Verdi for pengene": "",
    });
    expect(
      panel?.querySelector<HTMLElement>(".olmono-facts .olmono-value")?.title,
    ).toBe("Verdi for pengene: Middels");
    expect(panel?.querySelector(".olmono-badge")?.textContent).toBe("Ny");
    expect(panel?.querySelector(".olmono-panel-footer")?.textContent).toBe(
      "Oppdatert 14.07.2026 · Se på Ølmonopolet",
    );
    expect(document.body.innerHTML.toLowerCase()).not.toContain("untappd");
  });

  it("adds style comparison, releases, first seen and brewery", async () => {
    mockBeer({
      ...FULL_BEER,
      style_stats: { rank: 3, rated: 12, cheaper_than: 80, priced: 12 },
      releases: [
        { name: "Juleslipp 2026", release_date: "2026-11-06T08:00:00+01:00" },
      ],
      first_seen: "2024-03-14T09:00:00Z",
      brewery_details: {
        name: "Lervig",
        description: "Brewery in Stavanger.",
        untpd_url: "https://untappd.com/Lervig",
      },
    });

    await handleDetails();

    expect(facts()).toMatchObject({
      "Rangering i stilen": "Nr. 3 av 12",
      "Pris i stilen": "Billigere enn 80 %",
      Lansering: "Juleslipp 2026 (06.11.2026)",
      "På Vinmonopolet siden": "14.03.2024",
    });
    const brewery = document.querySelector(".olmono-panel-more");
    expect(brewery?.querySelector("summary")?.textContent).toBe("Om Lervig");
    expect(brewery?.querySelector("p")?.textContent).toBe(
      "Brewery in Stavanger.",
    );
    expect(document.body.innerHTML.toLowerCase()).not.toContain("untappd");
  });

  it.each([
    [{ rank: 1, rated: 4, cheaper_than: 50, priced: 4 }, {}],
    [
      { rank: null, rated: 9, cheaper_than: 100, priced: 9 },
      { "Pris i stilen": "Billigst i stilen" },
    ],
    [
      { rank: 9, rated: 9, cheaper_than: 0, priced: 9 },
      {
        "Rangering i stilen": "Nr. 9 av 9",
        "Pris i stilen": "Dyrest i stilen",
      },
    ],
  ])("shows style facts for %o", async (stats, expected) => {
    mockBeer({ ...FULL_BEER, style_stats: stats });

    await handleDetails();

    const shown = Object.fromEntries(
      Object.entries(facts()).filter(([label]) => label.endsWith("i stilen")),
    );
    expect(shown).toEqual(expected);
  });

  it.each([
    ["Short and sweet.", false],
    ["Hazy and juicy. ".repeat(20), true],
  ])("clamps long descriptions (%#)", async (description, clamped) => {
    mockBeer({ ...FULL_BEER, description });

    await handleDetails();

    const text = document.querySelector(".olmono-panel-text p");
    const toggle = document.querySelector<HTMLButtonElement>(
      ".olmono-panel-toggle",
    );
    expect(text?.textContent).toBe(description);
    expect(text?.classList.contains("olmono-clamp")).toBe(clamped);
    expect(toggle !== null).toBe(clamped);
    if (!toggle) return;
    toggle.click();
    expect(text?.classList.contains("olmono-clamp")).toBe(false);
    expect(toggle.textContent).toBe("Vis mindre");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it.each([
    [80, false],
    [120, true],
  ])(
    "shows the toggle only when the text overflows (%i)",
    async (scrollHeight, shown) => {
      let measure = (): void => {};
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            measure = callback;
          }
          observe(): void {}
        },
      );
      mockBeer({ ...FULL_BEER, description: "Hazy and juicy. ".repeat(20) });

      await handleDetails();

      const text = document.querySelector<HTMLElement>(".olmono-panel-text p");
      if (!text) throw new Error("missing description");
      Object.defineProperty(text, "scrollHeight", { value: scrollHeight });
      Object.defineProperty(text, "clientHeight", { value: 80 });
      measure();
      expect(
        document.querySelector<HTMLButtonElement>(".olmono-panel-toggle")
          ?.hidden,
      ).toBe(!shown);
    },
  );

  it("adds a compact summary beside the buy column", async () => {
    mockBeer({
      ...FULL_BEER,
      style_stats: { rank: 3, rated: 12, cheaper_than: 80, priced: 12 },
      first_seen: "2024-03-14T09:00:00Z",
    });
    const rows = document.querySelector("div.jznNJ0wW")!.childElementCount;

    await handleDetails();

    const hero = document.querySelector<HTMLElement>(
      ".jznNJ0wW.olmono-hero-grid > aside.olmono-hero:last-child",
    );
    expect(hero?.style.gridRow).toBe(`1 / span ${rows}`);
    expect(hero?.querySelector(".olmono-panel-score")?.textContent).toContain(
      "3,61",
    );
    expect(
      document.querySelector("div.drVuAFYe > .olmono-name-rating"),
    ).not.toBeNull();
    expect(facts(".olmono-hero")).toEqual({
      Stil: "IPA - American",
      IBU: "50",
      Alkoholenheter: "2,8",
      "Pris per alkoholenhet": "39 kr",
      "Verdi for pengene": "",
      "Rangering i stilen": "Nr. 3 av 12",
      "Pris i stilen": "Billigere enn 80 %",
    });
    const panelOnly = [
      ...document.querySelectorAll(
        ".olmono-panel .olmono-facts > div:not(.olmono-fact--summary) dt",
      ),
    ].map((dt) => dt.textContent);
    expect(panelOnly).toEqual(["På Vinmonopolet siden"]);
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
