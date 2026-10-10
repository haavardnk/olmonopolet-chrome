import type { Beer } from "../../shared/types";
import { getBeer, getLists } from "../api/client";
import { getProductIdFromUrl } from "../dom/product";
import { find } from "../dom/anchors";
import { ratingToStars, kFormatter, formatUpdated } from "../../shared/format";
import { productUrl, BEER_CATEGORIES } from "../../shared/constants";
import { retryUntil } from "../core/observer";
import { getSettings } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import {
  renderValueScore,
  applyLabelImage,
  appendSkeletonBars,
} from "../core/render";
import { injectTastedButton } from "../core/tasted";
import { injectListButton } from "../core/lists";

interface Block {
  container: HTMLDivElement;
  rating: HTMLAnchorElement;
  value: HTMLSpanElement;
}

function isBeerCategory(text: string | null | undefined): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();
  return BEER_CATEGORIES.some((cat) => upper.includes(cat));
}

function buildBlock(): Block {
  const container = document.createElement("div");
  container.classList.add("untappd", "olmono-skeleton");

  const rating = document.createElement("a");
  rating.classList.add("olmono-rating");
  rating.target = "_blank";
  rating.rel = "noopener noreferrer";
  appendSkeletonBars(rating);

  const value = document.createElement("span");
  value.classList.add("olmono-rating-value");

  container.append(rating);
  return { container, rating, value };
}

function findAlcoholRow(): HTMLElement | null {
  for (const strong of document.querySelectorAll<HTMLElement>("strong")) {
    if (strong.textContent?.trim() === "Alkohol") return strong.closest("p");
  }
  return null;
}

function hasExtraRow(parent: Element, label: string): boolean {
  return [...parent.querySelectorAll(":scope > .olmono-extra strong")].some(
    (strong) => strong.textContent?.trim() === label,
  );
}

function buildExtraRow(label: string, value: string): HTMLElement | null {
  const row = findAlcoholRow();
  if (!row) return null;

  const clone = row.cloneNode(true) as HTMLElement;
  clone.classList.add("olmono-extra");
  const span = clone.querySelector("span");
  const strong = clone.querySelector("strong");
  if (!span || !strong) return null;

  strong.textContent = label;
  for (const node of [...span.childNodes]) {
    if (node !== strong) node.remove();
  }
  span.append(` ${value}`);
  span.removeAttribute("aria-label");
  return clone;
}

function injectIBU(beer: Beer, category: Element): boolean {
  if (!beer.ibu) return true;
  if (!isBeerCategory(category.textContent)) return true;

  const row = findAlcoholRow();
  if (!row?.parentElement) return false;
  if (hasExtraRow(row.parentElement, "Ibu")) return true;

  const clone = buildExtraRow("Ibu", String(beer.ibu));
  if (!clone) return true;
  row.insertAdjacentElement("afterend", clone);
  return true;
}

function updateStyle(beer: Beer, category: Element): void {
  if (!beer.style || category.textContent?.includes("(")) return;
  if (!isBeerCategory(category.textContent)) return;

  const span = document.createElement("span");
  span.textContent = ` (${beer.style})`;
  category.appendChild(span);
}

function injectStyleToVaretype(beer: Beer): boolean {
  if (!beer.style) return true;

  const list = find("detailFacts");
  if (!list) return false;

  const row = [...list.querySelectorAll("li")].find((li) => {
    const spans = li.querySelectorAll(":scope > span");
    return spans.length >= 2 && spans[0].textContent?.trim() === "Varetype";
  });
  if (!row) return true;

  const value = row.querySelectorAll<HTMLElement>(":scope > span")[1];
  if (!value || value.dataset.olmonoStyle) return true;

  value.append(` (${beer.style})`);
  value.dataset.olmonoStyle = "1";
  return true;
}

function injectAlcoholUnits(beer: Beer): boolean {
  if (beer.alcohol_units === null || beer.alcohol_units === undefined)
    return true;

  const row = findAlcoholRow();
  if (!row?.parentElement) return false;
  if (hasExtraRow(row.parentElement, "Alkoholenheter")) return true;

  const clone = buildExtraRow(
    "Alkoholenheter",
    beer.alcohol_units.toFixed(1).replace(".", ","),
  );
  if (!clone) return true;
  row.insertAdjacentElement("afterend", clone);
  return true;
}

function injectPpau(beer: Beer): boolean {
  const value = beer.price_per_alcohol_unit;
  if (value === null || value === undefined) return true;

  const perLiter = find("detailPerLiter");
  const container = perLiter?.parentElement;
  if (!container) return false;
  if (container.querySelector(".olmono-ppau")) return true;

  const span = document.createElement("span");
  span.classList.add("olmono-ppau");
  span.textContent = `${Math.round(value)} kr/alkoholenhet`;
  container.appendChild(span);
  return true;
}

function injectExtraInfo(beer: Beer, category: Element): void {
  updateStyle(beer, category);
  void retryUntil(() => injectIBU(beer, category), {
    attempts: 20,
    delay: 300,
  });
  void retryUntil(() => injectStyleToVaretype(beer), {
    attempts: 20,
    delay: 300,
  });
}

function addBadges(beer: Beer, layout: Element): void {
  if (!beer.badges?.length || layout.querySelector(".badges")) return;

  for (const badge of beer.badges) {
    const div = document.createElement("div");
    div.classList.add("badges");
    const span = document.createElement("span");
    span.textContent = badge.text;
    div.appendChild(span);
    layout.appendChild(div);
  }
}

export async function handleDetails(signal?: AbortSignal): Promise<void> {
  const category = find("category");
  const container = category?.parentElement;
  if (!category || !container) return;
  if (!isBeerCategory(category.textContent)) return;
  if (container.querySelector(".untappd")) return;

  const id = getProductIdFromUrl();
  if (!id) return;

  const settings = await getSettings();
  const block = buildBlock();
  container.appendChild(block.container);

  const revealBlock = (): void => {
    block.container.classList.remove("olmono-skeleton");
    block.rating.replaceChildren(block.value);
  };

  let beer: Beer;
  try {
    beer = await getBeer(id);
  } catch {
    revealBlock();
    block.value.textContent = "Feil ved lasting";
    return;
  }
  revealBlock();
  if (signal?.aborted) return;

  if (beer.rating !== null && beer.rating !== undefined) {
    block.rating.insertBefore(ratingToStars(beer.rating), block.value);
    block.value.textContent = `${beer.rating.toFixed(2)} (${kFormatter(
      beer.checkins ?? 0,
    )})`;
    block.rating.href = productUrl(id);
    block.rating.title = beer.untpd_updated
      ? `Åpne på Ølmonopolet · ${formatUpdated(beer.untpd_updated)}`
      : "Åpne på Ølmonopolet";
    injectExtraInfo(beer, category);
  } else if (beer.detail === "Not found.") {
    block.value.textContent = "Ny, oppdateres ved neste kjøring";
  } else {
    block.value.textContent = "Ingen match";
  }

  const valueScore = renderValueScore(beer);
  if (valueScore) block.rating.appendChild(valueScore);

  void retryUntil(() => injectAlcoholUnits(beer), { attempts: 20, delay: 300 });
  void retryUntil(() => injectPpau(beer), { attempts: 20, delay: 300 });

  applyLabelImage(document, beer, settings.labelImage);

  if (await isConnected()) {
    const lists = await getLists();
    void retryUntil(
      () => injectTastedButton(document, id, beer.user_tasted ?? false),
      {
        attempts: 20,
        delay: 300,
      },
    );
    void retryUntil(() => injectListButton(document, id, lists), {
      attempts: 20,
      delay: 300,
    });
  }

  addBadges(beer, container);
}
