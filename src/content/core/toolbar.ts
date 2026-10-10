import {
  SORT_LABELS,
  setSettings,
  type Settings,
  type SortMode,
} from "../../shared/settings";
import { logo } from "./icons";

export interface ToolbarState {
  settings: Settings;
  connected: boolean;
  hiddenCount: number;
  failed: boolean;
  ignored: string[];
}

function build(): HTMLElement {
  const bar = document.createElement("div");
  bar.classList.add("olmono-toolbar");

  const sort = document.createElement("label");
  sort.classList.add("olmono-sort");
  sort.title = "Sorter med Ølmonopolet";
  const select = document.createElement("select");
  select.classList.add("olmono-sort-select");
  select.setAttribute("aria-label", "Sorter med Ølmonopolet");
  for (const [value, label] of Object.entries(SORT_LABELS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    void setSettings({ sort: select.value as SortMode });
  });
  sort.append(logo(16), select);

  const chip = document.createElement("button");
  chip.type = "button";
  chip.classList.add("olmono-chip");
  chip.addEventListener("click", () => {
    void setSettings({
      hideTasted: chip.getAttribute("aria-pressed") !== "true",
    });
  });

  bar.append(sort, chip);
  return bar;
}

function status(state: ToolbarState): HTMLElement | null {
  if (state.settings.sort === "vmp") return null;
  const note = document.createElement("span");
  note.classList.add("olmono-toolbar-note");
  if (state.failed) {
    const retry = document.createElement("button");
    retry.type = "button";
    retry.classList.add("olmono-link-btn");
    retry.textContent = "Prøv igjen";
    retry.addEventListener("click", () => location.reload());
    note.append("Kunne ikke sortere. ", retry);
    return note;
  }
  if (state.ignored.length === 0) return null;
  note.textContent = "Noen filtre er ikke brukt";
  note.title = `Ølmonopolet støtter ikke: ${state.ignored.join(", ")}`;
  return note;
}

export function removeToolbar(): void {
  document.querySelector(".olmono-toolbar")?.remove();
}

export function renderToolbar(anchor: Element, state: ToolbarState): void {
  let bar = document.querySelector<HTMLElement>(".olmono-toolbar");
  if (!bar || bar.nextElementSibling !== anchor) {
    bar?.remove();
    bar = build();
    anchor.before(bar);
  }

  const select = bar.querySelector<HTMLSelectElement>(".olmono-sort-select");
  if (select) select.value = state.settings.sort;

  const note = status(state);
  const current = bar.querySelector(".olmono-toolbar-note");
  if (!note || !current?.isEqualNode(note)) {
    current?.remove();
    if (note) bar.querySelector(".olmono-sort")?.after(note);
  }

  const chip = bar.querySelector<HTMLButtonElement>(".olmono-chip");
  if (!chip) return;
  const pressed = state.settings.hideTasted;
  chip.hidden = !state.connected;
  chip.setAttribute("aria-pressed", String(pressed));
  chip.textContent =
    pressed && state.hiddenCount > 0
      ? `Skjul smakte (${state.hiddenCount})`
      : "Skjul smakte";
}
