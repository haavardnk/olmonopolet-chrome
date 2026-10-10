import type { Beer } from "../../shared/types";
import { getBeer, getLists } from "../api/client";
import { getProductIdFromUrl } from "../dom/product";
import { find } from "../dom/anchors";
import { formatDate, formatNumber } from "../../shared/format";
import { productUrl, BEER_CATEGORIES } from "../../shared/constants";
import { retryUntil } from "../core/observer";
import { getSettings } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import {
  renderRating,
  renderSkeleton,
  renderBadges,
  renderValueScore,
  applyLabelImage,
} from "../core/render";
import { sweepStale } from "../core/inject";
import { logo } from "../core/icons";
import { injectTastedButton } from "../core/tasted";
import { injectListButton } from "../core/lists";

const RETRY = { attempts: 20, delay: 300 };

function isBeerCategory(text: string | null | undefined): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();
  return BEER_CATEGORIES.some((cat) => upper.includes(cat));
}

function messageRow(text: string): HTMLDivElement {
  const row = document.createElement("div");
  row.classList.add("olmono-row", "olmono-row--lg");
  const span = document.createElement("span");
  span.classList.add("olmono-rating");
  const message = document.createElement("span");
  message.classList.add("olmono-rating-empty");
  message.textContent = text;
  span.append(logo(20), message);
  row.appendChild(span);
  return row;
}

function addFact(list: HTMLElement, label: string, value: Node | string): void {
  const item = document.createElement("div");
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.append(value);
  item.append(dt, dd);
  list.appendChild(item);
}

function buildPanel(beer: Beer, id: string): HTMLElement {
  const panel = document.createElement("section");
  panel.classList.add("olmono-panel");
  panel.dataset.olmono = id;
  panel.setAttribute("aria-label", "Ølmonopolet");

  const title = document.createElement("h5");
  title.classList.add("olmono-panel-title");
  title.append(logo(20), "Ølmonopolet");
  panel.appendChild(title);

  const score = renderRating(beer, true);
  score.classList.add("olmono-panel-score");
  panel.appendChild(score);

  const facts = document.createElement("dl");
  facts.classList.add("olmono-facts");
  if (beer.style) addFact(facts, "Stil", beer.style);
  if (beer.ibu) addFact(facts, "IBU", String(beer.ibu));
  if (beer.alcohol_units !== null && beer.alcohol_units !== undefined) {
    addFact(facts, "Alkoholenheter", formatNumber(beer.alcohol_units, 1));
  }
  if (
    beer.price_per_alcohol_unit !== null &&
    beer.price_per_alcohol_unit !== undefined
  ) {
    addFact(
      facts,
      "Pris per alkoholenhet",
      `${formatNumber(beer.price_per_alcohol_unit)} kr`,
    );
  }
  const value = renderValueScore(beer);
  if (value && beer.value_score !== null && beer.value_score !== undefined) {
    const wrap = document.createElement("span");
    wrap.classList.add("olmono-fact-value");
    wrap.append(value, `${formatNumber(beer.value_score, 1)} av 20`);
    addFact(facts, "Verdi for pengene", wrap);
  }
  if (facts.childElementCount > 0) panel.appendChild(facts);

  const badges = renderBadges(beer.badges);
  if (badges) panel.appendChild(badges);

  const footer = document.createElement("p");
  footer.classList.add("olmono-panel-footer");
  if (beer.untpd_updated) {
    footer.append(`Oppdatert ${formatDate(beer.untpd_updated)} · `);
  }
  const link = document.createElement("a");
  link.href = productUrl(id);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Se på Ølmonopolet";
  footer.appendChild(link);
  panel.appendChild(footer);

  return panel;
}

function placePanel(panel: HTMLElement, id: string): boolean {
  const aside = find("detailAside");
  if (aside) {
    aside.prepend(panel);
    return true;
  }
  const columns = find("detailColumns");
  if (columns) {
    const wrap = document.createElement("div");
    wrap.classList.add("olmono-panel-wrap");
    wrap.dataset.olmono = id;
    wrap.appendChild(panel);
    columns.appendChild(wrap);
    return true;
  }
  const facts = find("detailFacts");
  if (!facts) return false;
  facts.before(panel);
  return true;
}

export async function handleDetails(signal?: AbortSignal): Promise<void> {
  const id = getProductIdFromUrl();
  if (!id) return;
  sweepStale(document, id);

  const category = find("category");
  const nameBlock = category?.parentElement;
  if (!category || !nameBlock) return;
  if (!isBeerCategory(category.textContent)) return;
  if (nameBlock.querySelector(`:scope > .olmono-row[data-olmono="${id}"]`)) {
    return;
  }

  const hero = renderSkeleton();
  hero.classList.add("olmono-row--lg");
  hero.dataset.olmono = id;
  nameBlock.appendChild(hero);

  let beer: Beer;
  try {
    beer = await getBeer(id);
  } catch (err) {
    if (signal?.aborted) return;
    const missing = err instanceof Error && err.message === "HTTP 404";
    const row = messageRow(
      missing ? "Ikke på Ølmonopolet ennå" : "Kunne ikke laste vurdering",
    );
    row.dataset.olmono = id;
    hero.replaceWith(row);
    return;
  }
  if (signal?.aborted) return;

  const row = renderRating(beer, true);
  row.dataset.olmono = id;
  hero.replaceWith(row);

  const stale = (): boolean => getProductIdFromUrl() !== id;
  const panel = buildPanel(beer, id);
  void retryUntil(() => stale() || placePanel(panel, id), RETRY);

  const settings = await getSettings();
  applyLabelImage(document, beer, settings.labelImage);

  if (!(await isConnected())) return;
  const lists = await getLists();
  if (signal?.aborted) return;
  void retryUntil(
    () =>
      stale() || injectTastedButton(document, id, beer.user_tasted ?? false),
    RETRY,
  );
  void retryUntil(
    () => stale() || injectListButton(document, id, lists),
    RETRY,
  );
}
