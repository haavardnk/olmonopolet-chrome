import type { Beer } from "../../shared/types";
import { getSettings, type SortMode } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import { find } from "../dom/anchors";
import {
  findProductCards,
  appendStyleToCategory,
  isBeer,
} from "../dom/product";
import { isSearchPath } from "../router";
import { renderToolbar, removeToolbar } from "../core/toolbar";
import { appliedSort } from "../core/bridge";
import { isBeerSearch, vmpSort } from "../core/beerQuery";
import { processCards } from "./shared";

const LIST_FIELDS =
  "vmp_id,style,rating,checkins,badges,value_score,price_per_alcohol_unit,label_hd_url,user_tasted";

function appendStyle(card: Element, beer: Beer): void {
  if (beer.style) appendStyleToCategory(card, String(beer.vmp_id), beer.style);
}

function reloadSorted(query: string, sort: SortMode): void {
  if (sort === "vmp" || vmpSort(query) === "relevance") {
    location.reload();
    return;
  }
  const [text, , ...facets] = query.split(":");
  const url = new URL(location.href);
  url.searchParams.set("q", [text, "relevance", ...facets].join(":"));
  location.assign(url.href);
}

export async function handleSearch(signal?: AbortSignal): Promise<void> {
  const settings = await getSettings();
  const connected = await isConnected();
  const cards = findProductCards();
  const query = isSearchPath()
    ? new URLSearchParams(location.search).get("q")
    : null;
  const sortWrap = find("sortSelect")?.parentElement;

  if (query === null || !sortWrap || !isBeerSearch(query, cards.some(isBeer))) {
    removeToolbar();
    await processCards(cards, {
      requireBeer: true,
      fields: LIST_FIELDS,
      signal,
      onRendered: appendStyle,
    });
    return;
  }

  const hideTasted = connected && settings.hideTasted;
  const applied = appliedSort();
  if (
    applied &&
    (applied.sort !== settings.sort ||
      (settings.sort !== "vmp" && applied.hideTasted !== hideTasted))
  ) {
    reloadSorted(query, settings.sort);
    return;
  }

  const toolbar = (): void =>
    renderToolbar(sortWrap, {
      settings,
      connected,
      hiddenCount: cards.filter((card) =>
        card.classList.contains("olmono-hidden-card"),
      ).length,
      failed: applied?.failed ?? false,
      ignored: applied?.ignored ?? [],
    });
  toolbar();
  await processCards(cards, {
    requireBeer: true,
    fields: LIST_FIELDS,
    hideTasted,
    signal,
    onRendered: appendStyle,
  });
  if (signal?.aborted) return;
  toolbar();
}
