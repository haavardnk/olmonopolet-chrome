import {
  getSettings,
  setSettings,
  type LabelImageMode,
} from "../shared/settings";
import { isConnected, clearToken, onTokenChange } from "../shared/auth";
import { extensionVersion } from "../shared/constants";
import { getHealth, type HealthPage } from "../shared/health";

const PAGE_LABELS: Record<HealthPage, string> = {
  search: "søkesider",
  details: "produktsider",
  cart: "handlekurven",
  wishlist: "Min liste",
};

const HEALTH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function initAuth(): void {
  const status = document.querySelector<HTMLElement>("#auth-status");
  const login = document.querySelector<HTMLAnchorElement>("#auth-login");
  const logout = document.querySelector<HTMLButtonElement>("#auth-logout");
  const hint = document.querySelector<HTMLElement>("#auth-hint");

  function render(connected: boolean): void {
    if (status) {
      status.textContent = connected
        ? "Tilkoblet olmonopolet.app"
        : "Ikke tilkoblet";
    }
    if (login) login.hidden = connected;
    if (logout) logout.hidden = !connected;
    if (hint) hint.hidden = connected;
  }

  void isConnected().then(render);
  onTokenChange((token) => render(token !== null));

  logout?.addEventListener("click", () => {
    void clearToken();
  });
}

function initVersion(): void {
  const el = document.querySelector<HTMLElement>("#version");
  if (el) el.textContent = `v${extensionVersion()}`;
}

async function initHealth(): Promise<void> {
  const box = document.querySelector<HTMLElement>("#health");
  const text = document.querySelector<HTMLElement>("#health-text");
  if (!box || !text) return;

  const version = extensionVersion();
  const cutoff = Date.now() - HEALTH_MAX_AGE;
  const entries = Object.entries(await getHealth()).filter(
    ([, entry]) => entry.version === version && Date.parse(entry.at) >= cutoff,
  );
  if (entries.length === 0) return;

  const broken = entries.filter(([, entry]) => entry.missing.length > 0);
  box.hidden = false;
  box.classList.toggle("is-degraded", broken.length > 0);
  if (broken.length === 0) {
    text.textContent = "Fungerer som det skal på vinmonopolet.no.";
    return;
  }
  const pages = broken.map(([page]) => PAGE_LABELS[page as HealthPage]);
  text.textContent = `vinmonopolet.no har endret seg. Noe kan mangle på ${pages.join(", ")}.`;
  box.title = broken
    .map(([page, entry]) => `${page}: ${entry.missing.join(", ")}`)
    .join("\n");
}

async function initSettings(): Promise<void> {
  const settings = await getSettings();

  const label = document.querySelector<HTMLSelectElement>("#select-label");
  if (label) {
    label.value = settings.labelImage;
    label.addEventListener("change", () => {
      void setSettings({ labelImage: label.value as LabelImageMode });
    });
  }

  const dim = document.querySelector<HTMLInputElement>("#toggle-tasted-dim");
  if (dim) {
    dim.checked = settings.tastedDim;
    dim.addEventListener("change", () => {
      void setSettings({ tastedDim: dim.checked });
    });
  }

  const reports = document.querySelector<HTMLInputElement>("#toggle-reports");
  if (reports) {
    reports.checked = settings.reports;
    reports.addEventListener("change", () => {
      void setSettings({ reports: reports.checked });
    });
  }
}

initAuth();
initVersion();
void initHealth();
void initSettings();
