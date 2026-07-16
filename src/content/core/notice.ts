import { APP_LOGIN_URL } from "../../shared/constants";

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
