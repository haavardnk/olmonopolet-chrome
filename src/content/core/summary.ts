import type { Beer } from "../../shared/types";
import { formatNumber, formatRating } from "../../shared/format";
import { logo } from "./icons";

export function renderSummary(
  list: Element,
  beers: Beer[],
  connected: boolean,
): void {
  const previous = list.previousElementSibling;
  const existing = previous?.classList.contains("olmono-summary")
    ? previous
    : null;
  if (beers.length === 0) {
    existing?.remove();
    return;
  }

  const parts = [`${formatNumber(beers.length)} øl`];
  const ratings = beers
    .map((beer) => beer.rating)
    .filter((rating): rating is number => rating !== null);
  if (ratings.length > 0) {
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    parts.push(`snittvurdering ${formatRating(average)}`);
  }
  if (connected) {
    const tasted = beers.filter((beer) => beer.user_tasted === true).length;
    parts.push(`${formatNumber(tasted)} smakt`);
  }

  const summary = existing ?? document.createElement("p");
  summary.classList.add("olmono-summary");
  summary.replaceChildren(logo(16), `Ølmonopolet · ${parts.join(" · ")}`);
  if (!existing) list.before(summary);
}
