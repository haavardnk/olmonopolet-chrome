import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { renderToolbar } from "../../src/content/core/toolbar";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type SortMode,
} from "../../src/shared/settings";

function stubChrome(stored: Partial<Settings>): Mock {
  const set = vi.fn();
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: stored })),
        set,
      },
    },
  });
  return set;
}

function mount(settings: Settings): HTMLSelectElement {
  const anchor = document.createElement("div");
  document.body.appendChild(anchor);
  renderToolbar(anchor, {
    settings,
    connected: true,
    hiddenCount: 0,
    failed: false,
    ignored: [],
  });
  return document.querySelector<HTMLSelectElement>(".olmono-sort-select")!;
}

function choose(select: HTMLSelectElement, sort: SortMode): void {
  select.value = sort;
  select.dispatchEvent(new Event("change"));
}

function openDialog(): Promise<HTMLDialogElement> {
  return vi.waitFor(() => {
    const dialog = document.querySelector<HTMLDialogElement>(".olmono-dialog");
    if (!dialog) throw new Error("dialog not open");
    return dialog;
  });
}

beforeEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("sort select", () => {
  it.each<[string, Partial<Settings>, SortMode]>([
    ["vinmonopolet order", {}, "vmp"],
    ["intro already seen", { sortIntroSeen: true }, "-rating"],
    ["already sorting with olmonopolet", { sort: "-rating" }, "-value_score"],
  ])("saves without asking for %s", async (_, stored, sort) => {
    const set = stubChrome(stored);
    choose(mount({ ...DEFAULT_SETTINGS, ...stored }), sort);

    await vi.waitFor(() => expect(set).toHaveBeenCalled());
    expect(document.querySelector(".olmono-dialog")).toBeNull();
    expect(set.mock.calls[0][0]["olmono:settings"].sort).toBe(sort);
  });

  it("explains olmonopolet sort on first use and remembers it", async () => {
    const set = stubChrome({});
    choose(mount(DEFAULT_SETTINGS), "-rating");

    const dialog = await openDialog();
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain("henter vi produktlisten");
    dialog
      .querySelector<HTMLButtonElement>(".olmono-dialog-btn-primary")!
      .click();

    await vi.waitFor(() => expect(set).toHaveBeenCalled());
    expect(set.mock.calls[0][0]["olmono:settings"]).toMatchObject({
      sort: "-rating",
      sortIntroSeen: true,
    });
    expect(document.querySelector(".olmono-dialog")).toBeNull();
  });

  it("restores vinmonopolet order when the intro is cancelled", async () => {
    const set = stubChrome({});
    const select = mount(DEFAULT_SETTINGS);
    choose(select, "-rating");

    const dialog = await openDialog();
    dialog.querySelector<HTMLButtonElement>(".olmono-dialog-btn")!.click();

    await vi.waitFor(() =>
      expect(document.querySelector(".olmono-dialog")).toBeNull(),
    );
    expect(select.value).toBe("vmp");
    expect(set).not.toHaveBeenCalled();
  });
});
