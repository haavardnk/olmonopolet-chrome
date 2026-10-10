import { storage } from "wxt/utils/storage";

export type LabelImageMode = "off" | "fill-if-missing" | "override";

export type SortMode =
  "vmp" | "-rating" | "-value_score" | "price_per_alcohol_unit";

export const SORT_LABELS: Record<SortMode, string> = {
  vmp: "Vinmonopolets rekkefølge",
  "-rating": "Høyest vurdering",
  "-value_score": "Best verdi for pengene",
  price_per_alcohol_unit: "Lavest pris per alkoholenhet",
};

export interface Settings {
  labelImage: LabelImageMode;
  tastedDim: boolean;
  hideTasted: boolean;
  sort: SortMode;
  sortIntroSeen: boolean;
  reports: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  labelImage: "off",
  tastedDim: false,
  hideTasted: false,
  sort: "vmp",
  sortIntroSeen: false,
  reports: true,
};

const settingsItem = storage.defineItem<Partial<Settings>>(
  "local:olmono:settings",
  { fallback: {} },
);

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await settingsItem.getValue()) };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next: Settings = { ...(await getSettings()), ...patch };
  await settingsItem.setValue(next);
  return next;
}

export function onSettingsChange(
  callback: (settings: Settings) => void,
): () => void {
  return settingsItem.watch((value) =>
    callback({ ...DEFAULT_SETTINGS, ...value }),
  );
}
