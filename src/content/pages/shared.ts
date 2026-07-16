import type { Beer } from "../../shared/types";
import { getSettings } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import { getBeers, getLists } from "../api/client";
import { getProductId, getInfoContainer, isBeer } from "../dom/product";
import { injectRating } from "../core/inject";
import { injectTastedButton } from "../core/tasted";
import { injectListButton } from "../core/lists";
import {
  renderRating,
  renderBadges,
  renderValueScore,
  applyLabelImage,
} from "../core/render";

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
  const settings = await getSettings();
  const connected = await isConnected();
  const lists = connected ? await getLists() : [];

  for (const [card, id] of idByCard) {
    const beer = beers.get(id);
    if (!beer) continue;

    const container = getInfoContainer(card);
    const node = renderRating(beer);
    const valueScore = renderValueScore(beer);
    const ratingRow = node.firstElementChild;
    if (valueScore && ratingRow) ratingRow.appendChild(valueScore);
    const badges = renderBadges(beer.badges);
    if (badges) node.appendChild(badges);

    if (injectRating(container, id, node)) {
      applyLabelImage(card, beer, settings.labelImage);
      if (connected) {
        injectTastedButton(card, id, beer.user_tasted ?? false);
        injectListButton(card, id, lists);
        if (beer.user_tasted && settings.tastedDim) {
          card.classList.add("olmono-tasted-card");
        }
      }
      opts.onRendered?.(card, beer);
    }
  }
}
