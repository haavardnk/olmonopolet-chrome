import { describe, it, expect, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  DEFAULT_SETTINGS,
  getSettings,
  setSettings,
  onSettingsChange,
} from "../../src/shared/settings";

describe("settings", () => {
  it("returns defaults when nothing is stored", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("merges stored values over defaults", async () => {
    await fakeBrowser.storage.local.set({
      "olmono:settings": { tastedDim: true },
    });
    await setSettings({ labelImage: "override" });
    expect(await getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      tastedDim: true,
      labelImage: "override",
    });
  });

  it("notifies subscribers on local change", async () => {
    const cb = vi.fn();
    onSettingsChange(cb);
    await fakeBrowser.storage.local.set({
      "olmono:settings": { labelImage: "override" },
    });
    expect(cb).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      labelImage: "override",
    });
  });

  it("ignores changes in other storage areas", async () => {
    const cb = vi.fn();
    onSettingsChange(cb);
    await fakeBrowser.storage.sync.set({
      "olmono:settings": { labelImage: "override" },
    });
    expect(cb).not.toHaveBeenCalled();
  });
});
