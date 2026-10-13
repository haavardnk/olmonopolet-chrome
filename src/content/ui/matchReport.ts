import { normalizeMatchUrl, reportWrongMatch } from "../api/wrongMatch";
import { logo } from "./icons";

const EXAMPLE = "https://untappd.com/b/…/12345";

function dialogButton(text: string, primary = false): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("olmono-dialog-btn");
  if (primary) btn.classList.add("olmono-dialog-btn-primary");
  btn.textContent = text;
  return btn;
}

function actionRow(...buttons: HTMLButtonElement[]): HTMLElement {
  const actions = document.createElement("div");
  actions.classList.add("olmono-dialog-actions");
  actions.append(...buttons);
  return actions;
}

export function openMatchReport(id: string, matched: boolean): void {
  document.querySelector(".olmono-dialog")?.remove();

  const dialog = document.createElement("dialog");
  dialog.classList.add("olmono-dialog");
  dialog.setAttribute("aria-labelledby", "olmono-dialog-title");

  const title = document.createElement("h2");
  title.id = "olmono-dialog-title";
  title.classList.add("olmono-dialog-title");
  title.append(logo(20), matched ? "Feil øl?" : "Foreslå match");

  const text = document.createElement("p");
  text.classList.add("olmono-dialog-text");
  text.textContent = matched
    ? "Er vurderingen hentet fra feil øl? Lim inn lenken til riktig øl, så retter vi det."
    : "Vi fant ingen vurdering for dette ølet. Lim inn lenken til riktig øl, så legger vi den til.";

  const form = document.createElement("form");
  form.noValidate = true;

  const input = document.createElement("input");
  input.type = "url";
  input.classList.add("olmono-dialog-input");
  input.placeholder = EXAMPLE;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "Lenke til riktig øl");

  const error = document.createElement("p");
  error.classList.add("olmono-dialog-error");
  error.setAttribute("role", "alert");
  error.hidden = true;

  const cancel = dialogButton("Avbryt");
  cancel.addEventListener("click", () => dialog.close());
  const send = dialogButton("Send", true);
  send.type = "submit";
  form.append(input, error, actionRow(cancel, send));

  const showError = (message: string): void => {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
  };

  const showDone = (): void => {
    text.textContent = "Takk! Forslaget ditt blir vurdert.";
    const close = dialogButton("Lukk", true);
    close.addEventListener("click", () => dialog.close());
    form.replaceWith(actionRow(close));
    close.focus();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = normalizeMatchUrl(input.value);
    if (!url) {
      showError(`Ugyldig lenke. Eksempel: ${EXAMPLE}`);
      return;
    }
    send.disabled = true;
    void reportWrongMatch(id, url).then((ok) => {
      send.disabled = false;
      if (ok) {
        showDone();
        return;
      }
      showError("Kunne ikke sende forslaget. Prøv igjen senere.");
    });
  });

  dialog.addEventListener("close", () => dialog.remove());
  dialog.append(title, text, form);
  document.body.appendChild(dialog);
  dialog.showModal();
  input.focus();
}
