import type { Beer } from "../../shared/types";
import { getBeers } from "../api/client";
import { getProductId, getInfoContainer, isBeer } from "../dom/product";
import { injectRating } from "../core/inject";
import { renderRating, renderBadges } from "../core/render";

export interface ProcessOptions {
  fields?: string;
  requireBeer?: boolean;
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

  const beers = await getBeers(ids, opts.fields);

  for (const [card, id] of idByCard) {
    const beer = beers.get(id);
    if (!beer) continue;

    const container = getInfoContainer(card);
    const node = renderRating(beer);
    const badges = renderBadges(beer.badges);
    if (badges) node.appendChild(badges);

    if (injectRating(container, id, node)) {
      opts.onRendered?.(card, beer);
    }
  }
}
