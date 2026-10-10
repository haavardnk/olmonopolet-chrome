import type { Beer } from "../../shared/types";
import { getSettings } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import { getBeers } from "../api/client";
import { getLists } from "../api/lists";
import {
  appendStyleToCategory,
  getProductId,
  getInfoContainer,
  isBeer,
} from "../dom/product";
import { find } from "../dom/anchors";
import {
  injectRating,
  injectSkeleton,
  removeSkeleton,
  sweepStale,
} from "../dom/inject";
import { injectTastedButton } from "../ui/tastedButton";
import { injectListButton } from "../ui/listButton";
import { renderSummary } from "../ui/summary";
import {
  renderCardRow,
  renderSkeleton,
  renderUnits,
  applyLabelImage,
} from "../ui/render";

export interface ProcessOptions {
  beersOnly?: boolean;
  hideTasted?: boolean;
  signal?: AbortSignal;
}

export async function processCards(
  cards: Element[],
  opts: ProcessOptions = {},
): Promise<Beer[]> {
  const relevant = opts.beersOnly ? cards.filter(isBeer) : cards;

  const idByCard = new Map<Element, string>();
  for (const card of relevant) {
    const id = getProductId(card);
    if (id) idByCard.set(card, id);
  }

  const ids = [...idByCard.values()];
  if (ids.length === 0) return [];

  const entries = [...idByCard].map(([card, id]) => ({
    card,
    id,
    container: getInfoContainer(card),
  }));

  for (const { card, id, container } of entries) {
    sweepStale(card, id);
    injectSkeleton(container, id, renderSkeleton());
  }

  const beers = await getBeers(ids);
  const settings = await getSettings();
  const connected = await isConnected();
  const lists = connected ? await getLists() : [];
  if (opts.signal?.aborted) return [];

  const rendered: Beer[] = [];
  for (const { card, id, container } of entries) {
    const beer = beers.get(id);
    if (!beer) {
      removeSkeleton(container, id);
      continue;
    }
    rendered.push(beer);

    const row = renderCardRow(beer);

    const tasted = connected && beer.user_tasted === true;
    card.classList.toggle("olmono-tasted-card", tasted && settings.tastedDim);
    card.classList.toggle("olmono-hidden-card", tasted && !!opts.hideTasted);
    if (injectRating(container, id, row)) {
      const units = renderUnits(beer);
      if (units) {
        card.querySelector(".olmono-units")?.remove();
        (find("productPrice", card) ?? row).appendChild(units);
      }
      applyLabelImage(card, beer, settings.labelImage);
      if (connected) {
        const tools = find("tools", card);
        injectTastedButton(tools, id, beer.user_tasted ?? false);
        injectListButton(tools, id, lists);
      }
      if (opts.beersOnly && beer.style) {
        appendStyleToCategory(card, id, beer.style);
      }
    }
  }
  return rendered;
}

export async function showSummary(
  beers: Beer[],
  signal?: AbortSignal,
): Promise<void> {
  const connected = await isConnected();
  if (signal?.aborted) return;
  const list = find("productList");
  if (list) renderSummary(list, beers, connected);
}
