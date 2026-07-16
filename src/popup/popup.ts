import {
  getSettings,
  setSettings,
  type LabelImageMode,
} from "../shared/settings";
import { isConnected, clearToken, onTokenChange } from "../shared/auth";

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
  if (el) el.textContent = `v${chrome.runtime.getManifest().version}`;
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
}

initAuth();
initVersion();
void initSettings();
