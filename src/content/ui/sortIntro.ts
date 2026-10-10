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
