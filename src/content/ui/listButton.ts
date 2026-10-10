import { addToList, removeFromList } from "../api/lists";
import type { UserList } from "../../shared/types";
import { ICONS, icon } from "./icons";

const MENU_WIDTH = 220;

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
  menu.setAttribute("role", "menu");

  const title = document.createElement("div");
  title.classList.add("olmono-list-title");
  title.textContent = "Ølmonopolet-lister";
  menu.appendChild(title);

  if (lists.length === 0) {
    const empty = document.createElement("div");
    empty.classList.add("olmono-list-empty");
    empty.textContent = "Du har ingen lister ennå.";
    menu.appendChild(empty);
    return menu;
  }

  for (const list of lists) {
    const item = document.createElement("button");
    item.type = "button";
    item.classList.add("olmono-list-item");
    item.setAttribute("role", "menuitemcheckbox");

    const check = icon(ICONS.check, 18);
    check.classList.add("olmono-list-check");
    const name = document.createElement("span");
    name.textContent = list.name;
    item.append(check, name);

    const setState = (member: boolean): void => {
      item.classList.toggle("is-member", member);
      item.setAttribute("aria-checked", String(member));
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
  tools: Element | null,
  id: string,
  lists: UserList[],
): boolean {
  if (!tools) return false;
  const existing = tools.querySelector<HTMLElement>(".olmono-list-btn");
  if (existing?.dataset.olmono === id) return true;
  existing?.remove();

  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("btn-icon", "olmono-list-btn");
  btn.dataset.olmono = id;
  btn.title = "Legg til i Ølmonopolet-liste";
  btn.setAttribute("aria-label", "Legg til i Ølmonopolet-liste");
  btn.setAttribute("aria-haspopup", "menu");
  btn.setAttribute("aria-expanded", "false");
  btn.appendChild(icon(ICONS.listAdd));

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
    const target = e.target as Node;
    if (menu && !menu.contains(target) && !btn.contains(target)) closeMenu();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== "Escape") return;
    closeMenu();
    btn.focus();
  };

  function closeMenu(): void {
    menu?.remove();
    menu = null;
    btn.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", closeMenu);
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
    menu.style.top = `${r.bottom + 4}px`;
    menu.style.left = `${Math.max(8, r.right - MENU_WIDTH)}px`;
    btn.setAttribute("aria-expanded", "true");
    setTimeout(() => {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onKey);
      window.addEventListener("scroll", closeMenu, { passive: true });
    }, 0);
  });

  tools.appendChild(btn);
  return true;
}
