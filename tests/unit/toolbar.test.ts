import { describe, it, expect, beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { renderToolbar } from "../../src/content/ui/toolbar";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type SortMode,
} from "../../src/shared/settings";

async function stored(): Promise<Partial<Settings> | undefined> {
  const data = await fakeBrowser.storage.local.get("olmono:settings");
  return data["olmono:settings"] as Partial<Settings> | undefined;
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
  document.body.innerHTML = "";
});

describe("sort select", () => {
  it.each<[string, Partial<Settings>, SortMode]>([
    ["vinmonopolet order", {}, "vmp"],
    ["intro already seen", { sortIntroSeen: true }, "-rating"],
    ["already sorting with olmonopolet", { sort: "-rating" }, "-value_score"],
  ])("saves without asking for %s", async (_, settings, sort) => {
    await fakeBrowser.storage.local.set({ "olmono:settings": settings });
    choose(mount({ ...DEFAULT_SETTINGS, ...settings }), sort);

    await vi.waitFor(async () => expect((await stored())?.sort).toBe(sort));
    expect(document.querySelector(".olmono-dialog")).toBeNull();
  });

  it("explains olmonopolet sort on first use and remembers it", async () => {
    choose(mount(DEFAULT_SETTINGS), "-rating");

    const dialog = await openDialog();
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain("henter vi produktlisten");
    dialog
      .querySelector<HTMLButtonElement>(".olmono-dialog-btn-primary")!
      .click();

    await vi.waitFor(async () =>
      expect(await stored()).toMatchObject({
        sort: "-rating",
        sortIntroSeen: true,
      }),
    );
    expect(document.querySelector(".olmono-dialog")).toBeNull();
  });

  it("restores vinmonopolet order when the intro is cancelled", async () => {
    const select = mount(DEFAULT_SETTINGS);
    choose(select, "-rating");

    const dialog = await openDialog();
    dialog.querySelector<HTMLButtonElement>(".olmono-dialog-btn")!.click();

    await vi.waitFor(() =>
      expect(document.querySelector(".olmono-dialog")).toBeNull(),
    );
    expect(select.value).toBe("vmp");
    expect(await stored()).toBeUndefined();
  });
});
