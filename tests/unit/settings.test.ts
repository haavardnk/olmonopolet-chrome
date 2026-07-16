import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  getSettings,
  setSettings,
  onSettingsChange,
} from "../../src/shared/settings";

type Listener = (
  changes: Record<string, { newValue?: unknown }>,
  area: string,
) => void;

function fakeChrome() {
  const store: Record<string, unknown> = {};
  const listeners: Listener[] = [];
  return {
    store,
    listeners,
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
      },
      onChanged: {
        addListener: (cb: Listener) => listeners.push(cb),
        removeListener: (cb: Listener) => {
          const i = listeners.indexOf(cb);
          if (i >= 0) listeners.splice(i, 1);
        },
      },
    },
  };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("settings", () => {
  it("returns defaults when chrome is unavailable", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("merges stored values over defaults", async () => {
    vi.stubGlobal("chrome", fakeChrome());
    await setSettings({ labelImage: "override" });
    const settings = await getSettings();
    expect(settings.labelImage).toBe("override");
    expect(settings.tastedDim).toBe(DEFAULT_SETTINGS.tastedDim);
  });

  it("notifies subscribers on local change", () => {
    const chrome = fakeChrome();
    vi.stubGlobal("chrome", chrome);
    const cb = vi.fn();
    onSettingsChange(cb);
    chrome.listeners.forEach((l) =>
      l({ "olmono:settings": { newValue: { labelImage: "off" } } }, "local"),
    );
    expect(cb).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, labelImage: "off" });
  });

  it("ignores changes in other storage areas", () => {
    const chrome = fakeChrome();
    vi.stubGlobal("chrome", chrome);
    const cb = vi.fn();
    onSettingsChange(cb);
    chrome.listeners.forEach((l) =>
      l({ "olmono:settings": { newValue: { labelImage: "off" } } }, "sync"),
    );
    expect(cb).not.toHaveBeenCalled();
  });
});
