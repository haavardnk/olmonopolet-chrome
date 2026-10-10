import { describe, it, expect, vi, afterEach } from "vitest";
import {
  renderRating,
  renderSkeleton,
  renderBadges,
  renderValueScore,
  renderCardRow,
  renderUnitPrice,
  applyLabelImage,
} from "../../src/content/ui/render";

describe("renderSkeleton", () => {
  it("renders a busy skeleton row with shimmer bars", () => {
    const el = renderSkeleton();
    expect(el.classList.contains("olmono-row")).toBe(true);
    expect(el.classList.contains("olmono-skeleton")).toBe(true);
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".olmono-logo")).toBeNull();
    expect(el.querySelectorAll(".olmono-skeleton-bar")).toHaveLength(2);
  });
});

describe("renderRating", () => {
  it("renders a star and the rating linked to olmonopolet", () => {
    const el = renderRating({ vmp_id: 15616302, rating: 3.606 });
    expect(el.classList.contains("olmono-row")).toBe(true);
    expect(el.querySelector(".olmono-star")).not.toBeNull();
    expect(el.querySelector(".olmono-rating-value")?.textContent).toBe("3,61");
    expect(el.querySelector("a.olmono-rating")?.getAttribute("href")).toBe(
      "https://olmonopolet.app/products/15616302",
    );
  });

  it.each([
    [{ rating: 3.6 }, false, false],
    [{ rating: 3.6 }, true, true],
    [{ rating: null }, false, false],
    [{ rating: null }, true, true],
  ])("shows the logo for %j large=%s: %s", (fields, large, shown) => {
    const el = renderRating({ vmp_id: 1, ...fields }, large);
    expect(el.querySelector(".olmono-logo") !== null).toBe(shown);
  });

  it.each([
    [false, "1,7k"],
    [true, "1\u00a0693 vurderinger"],
  ])("formats checkins for large=%s as %s", (large, text) => {
    const el = renderRating({ vmp_id: 1, rating: 3.6, checkins: 1693 }, large);
    expect(el.querySelector(".olmono-rating-count")?.textContent).toBe(text);
    expect(el.classList.contains("olmono-row--lg")).toBe(large);
  });

  it("shows a muted message without link or star when rating is null", () => {
    const el = renderRating({ vmp_id: 1, rating: null });
    expect(el.querySelector(".olmono-rating-empty")?.textContent).toBe(
      "Ingen vurdering",
    );
    expect(el.querySelector(".olmono-star")).toBeNull();
    expect(el.querySelector("a")).toBeNull();
  });

  it("never mentions Untappd", () => {
    const el = renderRating({ vmp_id: 1, rating: 3.6, checkins: 10 }, true);
    expect(el.outerHTML.toLowerCase()).not.toContain("untappd");
  });
});

describe("renderBadges", () => {
  it("returns null for empty or missing badges", () => {
    expect(renderBadges([])).toBeNull();
    expect(renderBadges(undefined)).toBeNull();
  });

  it("renders one span per badge", () => {
    const el = renderBadges([{ text: "New" }, { text: "Sour" }]);
    expect(el?.querySelectorAll("span")).toHaveLength(2);
  });
});

describe("renderValueScore", () => {
  it("renders a filled bar scaled to a 0-20 range", () => {
    const el = renderValueScore({ vmp_id: 1, rating: 4, value_score: 8 });
    const fill = el?.querySelector<HTMLElement>(".olmono-value-fill");
    expect(fill?.style.width).toBe("40%");
  });

  it("caps the bar at 20", () => {
    const el = renderValueScore({ vmp_id: 1, rating: 4, value_score: 25 });
    const fill = el?.querySelector<HTMLElement>(".olmono-value-fill");
    expect(fill?.style.width).toBe("100%");
  });

  it.each([
    [16, "olmono-value--success", "Svært god"],
    [12, "olmono-value--info", "God"],
    [7, "olmono-value--warning", "Middels"],
    [3, "olmono-value--error", "Lav"],
  ])("renders score %d as %s", (score, cls, label) => {
    const el = renderValueScore({ vmp_id: 1, rating: 4, value_score: score });
    expect(el?.classList.contains(cls)).toBe(true);
    expect(el?.title).toBe(`Verdi for pengene: ${label}`);
  });

  it("returns null when value_score is missing", () => {
    expect(renderValueScore({ vmp_id: 1, rating: 4 })).toBeNull();
  });
});

describe("renderCardRow", () => {
  it.each([
    [{ value_score: 8 }, ["Verdi"]],
    [{ value_score: null }, []],
  ])("renders the value fact for %j", (fields, facts) => {
    const row = renderCardRow({ vmp_id: 1, rating: 4, ...fields });
    expect(
      [...row.querySelectorAll(".olmono-fact")].map((el) => el.textContent),
    ).toEqual(facts);
  });
});

describe("renderUnitPrice", () => {
  it.each([
    [14.6, "15 kr/alkoholenhet"],
    [null, null],
  ])("renders %s as %s", (unitPrice, text) => {
    const el = renderUnitPrice({
      vmp_id: 1,
      rating: 4,
      price_per_alcohol_unit: unitPrice,
    });
    expect(el?.textContent ?? null).toBe(text);
  });
});

describe("applyLabelImage", () => {
  function root(): HTMLDivElement {
    const div = document.createElement("div");
    div.innerHTML = `<a href="/p/1"><img srcset="vmp-150.jpg 150w" /></a>`;
    return div;
  }
  const beer = { vmp_id: 1, rating: 4, label_sm_url: "untappd.jpg" };
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  function stubImage(width: number, height: number, error = false): void {
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = width;
      naturalHeight = height;
      set src(_value: string) {
        queueMicrotask(() => (error ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal("Image", FakeImage);
  }

  afterEach(() => vi.unstubAllGlobals());

  it("does nothing when off", () => {
    const el = root();
    applyLabelImage(el, beer, "off");
    expect(el.querySelector("img")?.getAttribute("src")).toBeNull();
  });

  it("overrides an existing image", () => {
    const el = root();
    applyLabelImage(el, beer, "override");
    expect(el.querySelector("img")?.src).toContain("untappd.jpg");
  });

  it("strips srcset and sizes when overriding", () => {
    const div = document.createElement("div");
    div.innerHTML = `<a href="/p/1"><img srcset="vmp-150.jpg 150w" sizes="300px" /></a>`;
    applyLabelImage(div, beer, "override");
    const img = div.querySelector("img");
    expect(img?.hasAttribute("srcset")).toBe(false);
    expect(img?.hasAttribute("sizes")).toBe(false);
    expect(img?.src).toContain("untappd.jpg");
  });

  it("prefers the HD label over the SD label", () => {
    const el = root();
    applyLabelImage(
      el,
      { vmp_id: 1, rating: 4, label_sm_url: "sm.jpg", label_hd_url: "hd.jpg" },
      "override",
    );
    expect(el.querySelector("img")?.src).toContain("hd.jpg");
  });

  it("fills when vmp returns the oversized placeholder", async () => {
    stubImage(154, 377);
    const el = root();
    applyLabelImage(el, beer, "fill-if-missing");
    await flush();
    expect(el.querySelector("img")?.src).toContain("untappd.jpg");
  });

  it("keeps the vmp image when it fits the cache box", async () => {
    stubImage(78, 150);
    const el = root();
    applyLabelImage(el, beer, "fill-if-missing");
    await flush();
    expect(el.querySelector("img")?.getAttribute("src")).toBeNull();
    expect(el.querySelector("img")?.hasAttribute("srcset")).toBe(true);
  });

  it("fills when the vmp image fails to load", async () => {
    stubImage(0, 0, true);
    const el = root();
    applyLabelImage(el, beer, "fill-if-missing");
    await flush();
    expect(el.querySelector("img")?.src).toContain("untappd.jpg");
  });
});
