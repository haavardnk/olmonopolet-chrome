import type { AnchorName } from "./anchorConfig";

export const HEALTH_KEY = "olmono:health";

export type HealthPage = "search" | "details" | "cart" | "wishlist";

export interface HealthEntry {
  missing: AnchorName[];
  at: string;
  version: string;
}

export type HealthState = Partial<Record<HealthPage, HealthEntry>>;

export async function getHealth(): Promise<HealthState> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return {};
  const data = await chrome.storage.local.get(HEALTH_KEY);
  return (data[HEALTH_KEY] as HealthState | undefined) ?? {};
}
