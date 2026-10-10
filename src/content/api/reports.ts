import type { AnchorName } from "../../shared/anchorConfig";
import { API_BASE_URL, extensionVersion } from "../../shared/constants";
import type { HealthPage } from "../../shared/health";
import { getSettings } from "../../shared/settings";
import { localArea } from "../../shared/storage";

const REPORTED_KEY = "olmono:reported";

export async function sendReport(
  page: HealthPage,
  anchors: AnchorName[],
): Promise<void> {
  const area = localArea();
  if (!area || !(await getSettings()).reports) return;

  const today = new Date().toISOString().slice(0, 10);
  const stored = (await area.get(REPORTED_KEY))[REPORTED_KEY] as
    Record<string, string> | undefined;
  const reported = Object.fromEntries(
    Object.entries(stored ?? {}).filter(([, day]) => day === today),
  );
  const fresh = anchors.filter((name) => reported[`${page}:${name}`] !== today);
  if (fresh.length === 0) return;

  const res = await fetch(`${API_BASE_URL}/extension/reports/`, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: extensionVersion(), page, anchors: fresh }),
  }).catch(() => null);
  if (!res?.ok) return;

  for (const name of fresh) reported[`${page}:${name}`] = today;
  await area.set({ [REPORTED_KEY]: reported });
}
