import { APP_LOGIN_URL } from "../../shared/constants";
import { logo } from "./icons";

const SORT_INTRO = [
  "Når du velger en av Ølmonopolets sorteringer, henter vi produktlisten fra Ølmonopolet i stedet for Vinmonopolet. Slik kan vi sortere hele utvalget, ikke bare produktene på siden.",
  "Filtrene du har valgt blir fortsatt brukt. Priser og utvalg oppdateres jevnlig, så det kan av og til være små avvik fra Vinmonopolet.",
  "Du kan når som helst bytte tilbake til Vinmonopolets rekkefølge.",
];

export function confirmOlmonoSort(): Promise<boolean> {
  document.querySelector(".olmono-dialog")?.remove();

  const dialog = document.createElement("dialog");
  dialog.classList.add("olmono-dialog");
  dialog.setAttribute("aria-labelledby", "olmono-dialog-title");

  const title = document.createElement("h2");
  title.id = "olmono-dialog-title";
  title.classList.add("olmono-dialog-title");
  title.append(logo(20), "Sorter med Ølmonopolet");

  const body = SORT_INTRO.map((text) => {
    const p = document.createElement("p");
    p.classList.add("olmono-dialog-text");
    p.textContent = text;
    return p;
  });

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.classList.add("olmono-dialog-btn");
  cancel.textContent = "Avbryt";
  cancel.addEventListener("click", () => dialog.close("cancel"));

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.classList.add("olmono-dialog-btn", "olmono-dialog-btn-primary");
  confirm.textContent = "Fortsett";
  confirm.addEventListener("click", () => dialog.close("confirm"));

  const actions = document.createElement("div");
  actions.classList.add("olmono-dialog-actions");
  actions.append(cancel, confirm);

  dialog.append(title, ...body, actions);
  document.body.appendChild(dialog);

  return new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      dialog.remove();
      resolve(dialog.returnValue === "confirm");
    });
    dialog.showModal();
    confirm.focus();
  });
}

export function notifySessionExpired(): void {
  if (typeof document === "undefined" || !document.body) return;
  if (document.querySelector(".olmono-toast")) return;

  const toast = document.createElement("div");
  toast.classList.add("olmono-toast");

  const text = document.createElement("span");
  text.textContent = "Ølmonopolet-økten er utløpt.";

  const link = document.createElement("a");
  link.classList.add("olmono-toast-link");
  link.href = APP_LOGIN_URL;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Logg inn på nytt";

  const close = document.createElement("button");
  close.type = "button";
  close.classList.add("olmono-toast-close");
  close.setAttribute("aria-label", "Lukk");
  close.textContent = "×";

  const dismiss = (): void => toast.remove();
  close.addEventListener("click", dismiss);
  link.addEventListener("click", dismiss);

  toast.append(text, link, close);
  document.body.appendChild(toast);

  setTimeout(dismiss, 12000);
}
