import type { AnchorName } from "./anchorConfig";
import { localArea } from "./storage";

export const HEALTH_KEY = "olmono:health";

export type HealthPage = "search" | "details" | "cart" | "wishlist";

export interface HealthEntry {
  missing: AnchorName[];
  at: string;
  version: string;
}

export type HealthState = Partial<Record<HealthPage, HealthEntry>>;

export async function getHealth(): Promise<HealthState> {
  const area = localArea();
  if (!area) return {};
  const data = await area.get(HEALTH_KEY);
  return (data[HEALTH_KEY] as HealthState | undefined) ?? {};
}
