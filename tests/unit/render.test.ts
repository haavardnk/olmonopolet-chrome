import { describe, it, expect } from "vitest";
import { renderRating, renderBadges } from "../../src/content/core/render";

describe("renderRating", () => {
  it("renders stars and an olmonopolet link for a rated beer", () => {
    const el = renderRating({ vmp_id: 15616302, rating: 3.606 });
    expect(el.classList.contains("untappd")).toBe(true);
    expect(el.querySelector(".stars")).not.toBeNull();

    const link = el.querySelector("a");
    expect(link?.href).toContain("olmonopolet.app/products/15616302");
    expect(link?.textContent).toBe("3.61");
  });

  it("shows 'Ingen match' and no stars when rating is null", () => {
    const el = renderRating({ vmp_id: 1, rating: null });
    expect(el.querySelector("a")?.textContent).toBe("Ingen match");
    expect(el.querySelector(".stars")).toBeNull();
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
