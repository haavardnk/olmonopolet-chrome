import { markTasted } from "../api/client";

const ICON_OUTLINE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>';

const ICON_FILLED =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11.5"/><path d="m7 12.5 3.2 3.2 6-6.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function injectTastedButton(
  root: ParentNode,
  id: string,
  initial: boolean,
): boolean {
  const tools = root.querySelector(".product-tools");
  if (!tools) return false;
  if (tools.querySelector(".olmono-tasted-btn")) return true;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("btn-icon", "olmono-tasted-btn");

  let tasted = initial;
  const render = (): void => {
    btn.innerHTML = tasted ? ICON_FILLED : ICON_OUTLINE;
    btn.classList.toggle("is-tasted", tasted);
    const label = tasted ? "Smakt" : "Marker som smakt";
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-pressed", String(tasted));
  };
  render();

  btn.addEventListener("click", () => {
    const next = !tasted;
    void markTasted(id, next).then((ok) => {
      if (ok) {
        tasted = next;
        render();
      }
    });
  });

  tools.appendChild(btn);
  return true;
}
