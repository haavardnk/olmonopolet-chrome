import { productUrl } from "../../shared/constants";
import { ratingToStars } from "../../shared/format";
import type { Beer, Badge } from "../../shared/types";

export function renderRating(beer: Beer): HTMLDivElement {
  const container = document.createElement("div");
  container.classList.add("untappd");

  const rating = document.createElement("div");
  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  container.appendChild(rating);

  if (beer.rating !== null && beer.rating !== undefined) {
    rating.appendChild(ratingToStars(beer.rating));
    link.href = productUrl(beer.vmp_id);
    link.textContent = beer.rating.toPrecision(3);
  } else {
    link.textContent = "Ingen match";
  }

  rating.appendChild(link);
  return container;
}

export function renderBadges(
  badges: Badge[] | undefined,
): HTMLDivElement | null {
  if (!badges?.length) return null;

  const wrap = document.createElement("div");
  wrap.classList.add("badges");
  badges.forEach((badge) => {
    const span = document.createElement("span");
    span.textContent = badge.text;
    wrap.appendChild(span);
  });
  return wrap;
}
