import { storage } from "wxt/utils/storage";
import type { AnchorName } from "./anchorConfig";

export type HealthPage = "search" | "details" | "cart" | "wishlist";

export interface HealthEntry {
  missing: AnchorName[];
  at: string;
  version: string;
}

export type HealthState = Partial<Record<HealthPage, HealthEntry>>;

export const healthItem = storage.defineItem<HealthState>(
  "local:olmono:health",
  { fallback: {} },
);

export function getHealth(): Promise<HealthState> {
  return healthItem.getValue();
}
