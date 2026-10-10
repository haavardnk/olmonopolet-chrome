import { localArea, onLocalChange } from "./storage";

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

const STORAGE_KEY = "olmono:settings";

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
  return onLocalChange(STORAGE_KEY, (value) =>
    callback({
      ...DEFAULT_SETTINGS,
      ...(value as Partial<Settings> | undefined),
    }),
  );
}
