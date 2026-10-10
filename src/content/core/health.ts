import type { AnchorName } from "../../shared/anchorConfig";
import { extensionVersion } from "../../shared/constants";
import {
  HEALTH_KEY,
  type HealthPage,
  type HealthState,
} from "../../shared/health";
import { sendReport } from "../api/reports";

const recorded = new Map<HealthPage, string>();
const pending = new Map<HealthPage, ReturnType<typeof setTimeout>>();

export const SETTLE_DELAY = 5000;

export function resetHealth(): void {
  recorded.clear();
  for (const timer of pending.values()) clearTimeout(timer);
  pending.clear();
}

export function checkHealth(
  page: HealthPage,
  evaluate: () => AnchorName[],
): void {
  if (evaluate().length === 0) {
    clearTimeout(pending.get(page));
    pending.delete(page);
    void recordHealth(page, []);
    return;
  }
  if (pending.has(page)) return;
  pending.set(
    page,
    setTimeout(() => {
      pending.delete(page);
      void recordHealth(page, evaluate());
    }, SETTLE_DELAY),
  );
}

export async function recordHealth(
  page: HealthPage,
  missing: AnchorName[],
): Promise<void> {
  const key = missing.join(",");
  if (recorded.get(page) === key) return;
  recorded.set(page, key);

  if (missing.length > 0) {
    console.warn(`[olmono] Fant ikke elementer på ${page}: ${key}`);
  }
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;

  const area = chrome.storage.local;
  const state = ((await area.get(HEALTH_KEY))[HEALTH_KEY] ?? {}) as HealthState;
  state[page] = {
    missing,
    at: new Date().toISOString(),
    version: extensionVersion(),
  };
  await area.set({ [HEALTH_KEY]: state });

  if (missing.length > 0) await sendReport(page, missing);
}
