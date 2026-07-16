import { describe, it, expect, vi, afterEach } from "vitest";
import {
  renderRating,
  renderBadges,
  renderValueScore,
  applyLabelImage,
} from "../../src/content/core/render";

describe("renderRating", () => {
  it("renders stars, a value and links to olmonopolet for a rated beer", () => {
    const el = renderRating({ vmp_id: 15616302, rating: 3.606 });
    expect(el.classList.contains("untappd")).toBe(true);
    expect(el.querySelector(".stars")).not.toBeNull();
    expect(el.querySelector(".olmono-rating-value")?.textContent).toBe("3.61");
    expect(el.querySelector("a.olmono-rating")?.getAttribute("href")).toContain(
      "olmonopolet.app/products/15616302",
    );
  });

  it("includes checkins in the value when present", () => {
    const el = renderRating({ vmp_id: 1, rating: 3.6, checkins: 1693 });
    expect(el.querySelector(".olmono-rating-value")?.textContent).toBe(
      "3.60 (2k)",
    );
  });

  it("shows 'Ingen match', no stars and no link when rating is null", () => {
    const el = renderRating({ vmp_id: 1, rating: null });
    expect(el.querySelector(".olmono-rating-value")?.textContent).toBe(
      "Ingen match",
    );
    expect(el.querySelector(".stars")).toBeNull();
    expect(
      el.querySelector("a.olmono-rating")?.getAttribute("href"),
    ).toBeNull();
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
    [16, "olmono-value--success"],
    [12, "olmono-value--info"],
    [7, "olmono-value--warning"],
    [3, "olmono-value--error"],
  ])("colors score %d as %s", (score, cls) => {
    const el = renderValueScore({ vmp_id: 1, rating: 4, value_score: score });
    expect(el?.classList.contains(cls)).toBe(true);
  });

  it("returns null when value_score is missing", () => {
    expect(renderValueScore({ vmp_id: 1, rating: 4 })).toBeNull();
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
