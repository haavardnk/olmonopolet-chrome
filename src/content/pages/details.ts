import type { Beer } from "../../shared/types";
import { getBeer } from "../api/client";
import { getLists } from "../api/lists";
import { getProductIdFromUrl, isBeerText } from "../dom/product";
import { find } from "../dom/anchors";
import { retryUntil } from "../core/observer";
import { getSettings } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import {
  renderMessage,
  renderRating,
  renderSkeleton,
  applyLabelImage,
} from "../ui/render";
import { renderPanel } from "../ui/panel";
import { sweepStale } from "../dom/inject";
import { injectTastedButton } from "../ui/tastedButton";
import { injectListButton } from "../ui/listButton";

const RETRY = { attempts: 20, delay: 300 };

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
  if (!isBeerText(category.textContent)) return;
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
    const row = renderMessage(
      missing ? "Ikke på Ølmonopolet ennå" : "Kunne ikke laste vurdering",
      true,
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
  const panel = renderPanel(beer, id);
  void retryUntil(() => stale() || placePanel(panel, id), RETRY);

  const settings = await getSettings();
  applyLabelImage(document, beer, settings.labelImage);

  if (!(await isConnected())) return;
  const lists = await getLists();
  if (signal?.aborted) return;
  void retryUntil(
    () =>
      stale() ||
      injectTastedButton(find("tools"), id, beer.user_tasted ?? false),
    RETRY,
  );
  void retryUntil(
    () => stale() || injectListButton(find("tools"), id, lists),
    RETRY,
  );
}
