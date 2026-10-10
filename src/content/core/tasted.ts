import { markTasted } from "../api/client";
import { find } from "../dom/anchors";
import { ICONS, icon } from "./icons";

export function injectTastedButton(
  root: ParentNode,
  id: string,
  initial: boolean,
): boolean {
  const tools = find("tools", root);
  if (!tools) return false;
  const existing = tools.querySelector<HTMLElement>(".olmono-tasted-btn");
  if (existing?.dataset.olmono === id) return true;
  existing?.remove();

  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("btn-icon", "olmono-tasted-btn");
  btn.dataset.olmono = id;

  let tasted = initial;
  const render = (): void => {
    btn.replaceChildren(icon(tasted ? ICONS.tastedFilled : ICONS.tasted));
    btn.classList.toggle("is-tasted", tasted);
    const label = tasted ? "Smakt" : "Marker som smakt";
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-pressed", String(tasted));
  };
  render();

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !tasted;
    void markTasted(id, next).then((ok) => {
      if (!ok) return;
      tasted = next;
      render();
    });
  });

  tools.appendChild(btn);
  return true;
}
