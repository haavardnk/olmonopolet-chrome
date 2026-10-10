import { storage } from "wxt/utils/storage";
import {
  ANCHOR_NAMES,
  CONFIG_SCHEMA,
  type AnchorMap,
  type Strategy,
} from "../../shared/anchorConfig";
import { API_BASE_URL, extensionVersion } from "../../shared/constants";
import { setAnchors } from "../dom/anchors";

const MAX_AGE = 6 * 60 * 60 * 1000;
const MAX_UP = 10;

interface CachedConfig {
  fetchedAt: number;
  data: unknown;
}

const configItem = storage.defineItem<CachedConfig>("local:olmono:config");

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSelector(css: string): boolean {
  try {
    document.createDocumentFragment().querySelector(css);
    return true;
  } catch {
    return false;
  }
}

function parseStrategy(value: unknown): Strategy | null {
  if (!isRecord(value)) return null;
  const { css, text, up } = value;
  if (typeof css !== "string" || !isValidSelector(css)) return null;
  const strategy: Strategy = { css };
  if (text !== undefined) {
    if (typeof text !== "string") return null;
    strategy.text = text;
  }
  if (up !== undefined) {
    if (typeof up !== "number" || !Number.isInteger(up)) return null;
    if (up < 0 || up > MAX_UP) return null;
    strategy.up = up;
  }
  return strategy;
}

export function parseConfig(
  data: unknown,
  version: string,
): Partial<AnchorMap> | null {
  if (!isRecord(data) || data.schema !== CONFIG_SCHEMA) return null;
  if (
    typeof data.minExtVersion === "string" &&
    compareVersions(version, data.minExtVersion) < 0
  )
    return null;
  if (!isRecord(data.anchors)) return null;

  const overrides: Partial<AnchorMap> = {};
  for (const name of ANCHOR_NAMES) {
    const raw = data.anchors[name];
    if (!Array.isArray(raw) || raw.length === 0) continue;
    const strategies = raw.map(parseStrategy);
    if (strategies.every((s): s is Strategy => s !== null)) {
      overrides[name] = strategies;
    }
  }
  return overrides;
}

function apply(data: unknown): void {
  setAnchors(parseConfig(data, extensionVersion()) ?? {});
}

async function refresh(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/extension/config/`, {
    credentials: "omit",
  });
  if (!res.ok && res.status !== 404) return;
  const data: unknown = res.ok ? await res.json() : null;
  await configItem.setValue({ fetchedAt: Date.now(), data });
  apply(data);
}

export async function loadConfig(): Promise<void> {
  const stored = await configItem.getValue();
  if (stored) apply(stored.data);
  if (!stored || Date.now() - stored.fetchedAt > MAX_AGE) {
    void refresh().catch(() => {});
  }
}
