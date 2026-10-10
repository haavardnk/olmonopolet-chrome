import { describe, it, expect, beforeEach, vi } from "vitest";
import { injectListButton } from "../../src/content/ui/listButton";
import { clearListsCache } from "../../src/content/api/lists";

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  clearListsCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML =
    '<div class="sMnNlv3t"><button aria-label="Min liste"></button></div>';
});

describe("injectListButton", () => {
  const lists = () => [
    { id: 1, name: "Handleliste", list_type: "shopping", product_ids: [] },
  ];
  const tools = () => document.querySelector(".sMnNlv3t");

  it("adds a list button to the product tools", () => {
    expect(injectListButton(tools(), "111", lists())).toBe(true);
    expect(document.querySelector(".olmono-list-btn")).not.toBeNull();
  });

  it("returns false when there is no product tools cluster", () => {
    expect(injectListButton(null, "111", lists())).toBe(false);
  });

  it("shows a count badge when the product is already in lists", () => {
    injectListButton(tools(), "111", [
      { id: 1, name: "A", list_type: "standard", product_ids: ["111"] },
      { id: 2, name: "B", list_type: "standard", product_ids: ["111"] },
      { id: 3, name: "C", list_type: "standard", product_ids: [] },
    ]);
    const badge = document.querySelector<HTMLElement>(".olmono-list-badge");
    expect(badge?.hidden).toBe(false);
    expect(badge?.textContent).toBe("2");
  });

  it("opens a menu and toggles membership and badge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 201 }),
    );

    const data = lists();
    injectListButton(tools(), "111", data);
    const badge = document.querySelector<HTMLElement>(".olmono-list-badge")!;
    expect(badge.hidden).toBe(true);

    document.querySelector<HTMLButtonElement>(".olmono-list-btn")!.click();
    const item = document.querySelector<HTMLButtonElement>(".olmono-list-item");
    expect(item?.textContent).toContain("Handleliste");
    expect(item?.classList.contains("is-member")).toBe(false);

    item!.click();
    await flush();

    expect(item?.classList.contains("is-member")).toBe(true);
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe("1");
  });
});
