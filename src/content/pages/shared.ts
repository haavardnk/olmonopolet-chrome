import type { Beer } from "../../shared/types";
import { getSettings } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import { getBeers, getLists } from "../api/client";
import { getProductId, getInfoContainer, isBeer } from "../dom/product";
import {
  injectRating,
  injectSkeleton,
  removeSkeleton,
  sweepStale,
} from "../core/inject";
import { injectTastedButton } from "../core/tasted";
import { injectListButton } from "../core/lists";
import {
  renderRating,
  renderSkeleton,
  renderBadges,
  renderValueScore,
  applyLabelImage,
} from "../core/render";

export interface ProcessOptions {
  fields?: string;
  requireBeer?: boolean;
  signal?: AbortSignal;
  onRendered?: (card: Element, beer: Beer) => void;
}

export async function processCards(
  cards: Element[],
  opts: ProcessOptions = {},
): Promise<void> {
  const relevant = opts.requireBeer ? cards.filter(isBeer) : cards;

  const idByCard = new Map<Element, string>();
  for (const card of relevant) {
    const id = getProductId(card);
    if (id) idByCard.set(card, id);
  }

  const ids = [...idByCard.values()];
  if (ids.length === 0) return;

  const entries = [...idByCard].map(([card, id]) => ({
    card,
    id,
    container: getInfoContainer(card),
  }));

  for (const { card, id, container } of entries) {
    sweepStale(card, id);
    injectSkeleton(container, id, renderSkeleton());
  }

  const beers = await getBeers(ids, opts.fields);
  const settings = await getSettings();
  const connected = await isConnected();
  const lists = connected ? await getLists() : [];
  if (opts.signal?.aborted) return;

  for (const { card, id, container } of entries) {
    const beer = beers.get(id);
    if (!beer) {
      removeSkeleton(container, id);
      continue;
    }

    const row = renderRating(beer);
    const valueScore = renderValueScore(beer);
    if (valueScore) row.appendChild(valueScore);
    const badges = renderBadges(beer.badges);
    if (badges) row.appendChild(badges);

    card.classList.toggle(
      "olmono-tasted-card",
      connected && settings.tastedDim && beer.user_tasted === true,
    );
    if (injectRating(container, id, row)) {
      applyLabelImage(card, beer, settings.labelImage);
      if (connected) {
        injectTastedButton(card, id, beer.user_tasted ?? false);
        injectListButton(card, id, lists);
      }
      opts.onRendered?.(card, beer);
    }
  }
}
