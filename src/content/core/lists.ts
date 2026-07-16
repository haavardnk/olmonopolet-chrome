import { addToList, removeFromList } from "../api/client";
import type { UserList } from "../../shared/types";

const LIST_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/></svg>';

function inList(list: UserList, id: string): boolean {
  return (list.product_ids ?? []).map(String).includes(id);
}

function buildMenu(
  lists: UserList[],
  id: string,
  onChange: () => void,
): HTMLElement {
  const menu = document.createElement("div");
  menu.classList.add("olmono-list-menu");

  if (lists.length === 0) {
    const empty = document.createElement("div");
    empty.classList.add("olmono-list-empty");
    empty.textContent = "Ingen lister";
    menu.appendChild(empty);
    return menu;
  }

  for (const list of lists) {
    const item = document.createElement("button");
    item.type = "button";
    item.classList.add("olmono-list-item");

    const setState = (member: boolean): void => {
      item.classList.toggle("is-member", member);
      item.textContent = (member ? "✓ " : "") + list.name;
    };
    setState(inList(list, id));

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const member = inList(list, id);
      const action = member
        ? removeFromList(list.id, id)
        : addToList(list.id, id);
      void action.then((ok) => {
        if (!ok) return;
        list.product_ids = list.product_ids ?? [];
        list.product_ids = member
          ? list.product_ids.filter((p) => String(p) !== id)
          : [...list.product_ids, id];
        setState(!member);
        onChange();
      });
    });

    menu.appendChild(item);
  }

  return menu;
}

export function injectListButton(
  root: ParentNode,
  id: string,
  lists: UserList[],
): boolean {
  const tools = root.querySelector(".product-tools");
  if (!tools) return false;
  if (tools.querySelector(".olmono-list-btn")) return true;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("btn-icon", "olmono-list-btn");
  btn.title = "Legg til i Ølmonopolet-liste";
  btn.setAttribute("aria-label", "Legg til i Ølmonopolet-liste");
  btn.innerHTML = LIST_ICON;

  const badge = document.createElement("span");
  badge.classList.add("olmono-list-badge");
  btn.appendChild(badge);

  const refreshBadge = (): void => {
    const count = lists.filter((l) => inList(l, id)).length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  };
  refreshBadge();

  let menu: HTMLElement | null = null;

  const onDocClick = (e: MouseEvent): void => {
    if (
      menu &&
      !menu.contains(e.target as Node) &&
      !btn.contains(e.target as Node)
    ) {
      closeMenu();
    }
  };

  function closeMenu(): void {
    menu?.remove();
    menu = null;
    document.removeEventListener("click", onDocClick);
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (menu) {
      closeMenu();
      return;
    }
    menu = buildMenu(lists, id, refreshBadge);
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${r.bottom + 4}px`;
    menu.style.left = `${Math.max(8, r.right - 200)}px`;
    setTimeout(() => document.addEventListener("click", onDocClick), 0);
  });

  tools.appendChild(btn);
  return true;
}
