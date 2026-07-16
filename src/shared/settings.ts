export type LabelImageMode = "off" | "fill-if-missing" | "override";

export interface Settings {
  labelImage: LabelImageMode;
  tastedDim: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  labelImage: "fill-if-missing",
  tastedDim: true,
};

const STORAGE_KEY = "olmono:settings";

function localArea(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === "undefined") return null;
  return chrome.storage?.local ?? null;
}

export async function getSettings(): Promise<Settings> {
  const area = localArea();
  if (!area) return { ...DEFAULT_SETTINGS };
  const data = await area.get(STORAGE_KEY);
  const stored = data[STORAGE_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next: Settings = { ...(await getSettings()), ...patch };
  const area = localArea();
  if (area) await area.set({ [STORAGE_KEY]: next });
  return next;
}

export function onSettingsChange(
  callback: (settings: Settings) => void,
): () => void {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged)
    return () => {};
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ): void => {
    if (area !== "local" || !changes[STORAGE_KEY]) return;
    const value = changes[STORAGE_KEY].newValue as
      Partial<Settings> | undefined;
    callback({ ...DEFAULT_SETTINGS, ...value });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
