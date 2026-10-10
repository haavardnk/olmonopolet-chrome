import { VMP_IMAGE_CACHE, productUrl } from "../../shared/constants";
import { formatCompact, formatNumber, formatRating } from "../../shared/format";
import type { Beer, Badge } from "../../shared/types";
import type { LabelImageMode } from "../../shared/settings";
import { find } from "../dom/anchors";
import { ICONS, icon } from "./icons";

export function externalLink(href: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

export function renderMessage(text: string, large = false): HTMLDivElement {
  const row = document.createElement("div");
  row.classList.add("olmono-row");
  if (large) row.classList.add("olmono-row--lg");
  const span = document.createElement("span");
  span.classList.add("olmono-rating");
  const message = document.createElement("span");
  message.classList.add("olmono-rating-empty");
  message.textContent = text;
  span.append(message);
  row.appendChild(span);
  return row;
}

export function renderRating(beer: Beer, large = false): HTMLDivElement {
  if (beer.rating === null || beer.rating === undefined) {
    return renderMessage("Ingen vurdering", large);
  }

  const row = document.createElement("div");
  row.classList.add("olmono-row");
  if (large) row.classList.add("olmono-row--lg");

  const link = externalLink(productUrl(beer.vmp_id));
  link.classList.add("olmono-rating");
  link.title = "Åpne på Ølmonopolet";

  const star = icon(ICONS.star, large ? 20 : 16);
  star.classList.add("olmono-star");

  const value = document.createElement("span");
  value.classList.add("olmono-rating-value");
  value.textContent = formatRating(beer.rating);
  link.append(star, value);

  if (beer.checkins !== null && beer.checkins !== undefined) {
    const count = document.createElement("span");
    count.classList.add("olmono-rating-count");
    count.textContent = large
      ? `${formatNumber(beer.checkins)} vurderinger`
      : formatCompact(beer.checkins);
    count.title = `${formatNumber(beer.checkins)} vurderinger`;
    link.appendChild(count);
  }

  row.appendChild(link);
  return row;
}

export function renderSkeleton(): HTMLDivElement {
  const row = document.createElement("div");
  row.classList.add("olmono-row", "olmono-skeleton");
  row.setAttribute("aria-busy", "true");
  const value = document.createElement("span");
  value.classList.add("olmono-skeleton-bar", "olmono-skeleton-text");
  const bar = document.createElement("span");
  bar.classList.add("olmono-skeleton-bar", "olmono-skeleton-value");
  row.append(value, bar);
  return row;
}

export function renderBadges(
  badges: Badge[] | undefined,
): HTMLSpanElement | null {
  if (!badges?.length) return null;

  const wrap = document.createElement("span");
  wrap.classList.add("olmono-badges");
  for (const badge of badges) {
    const chip = document.createElement("span");
    chip.classList.add("olmono-badge");
    chip.textContent = badge.text;
    wrap.appendChild(chip);
  }
  return wrap;
}

function valueLevel(score: number): [string, string] {
  if (score >= 15) return ["success", "Svært god"];
  if (score >= 10) return ["info", "God"];
  if (score >= 5) return ["warning", "Middels"];
  return ["error", "Lav"];
}

export function renderValueScore(beer: Beer): HTMLSpanElement | null {
  const score = beer.value_score;
  if (score === null || score === undefined) return null;

  const [level, label] = valueLevel(score);
  const track = document.createElement("span");
  track.classList.add("olmono-value", `olmono-value--${level}`);
  track.title = `Verdi for pengene: ${label}`;
  track.setAttribute("role", "img");
  track.setAttribute("aria-label", track.title);

  const fill = document.createElement("span");
  fill.classList.add("olmono-value-fill");
  fill.style.width = `${(Math.min(Math.max(score, 0), 20) / 20) * 100}%`;
  track.appendChild(fill);

  return track;
}

export function renderCardRow(beer: Beer): HTMLDivElement {
  const row = renderRating(beer);
  const value = renderValueScore(beer);
  if (value) {
    const fact = document.createElement("span");
    fact.classList.add("olmono-fact");
    fact.append("Verdi", value);
    row.appendChild(fact);
  }
  const badges = renderBadges(beer.badges);
  if (badges) row.appendChild(badges);
  return row;
}

export function renderUnitPrice(beer: Beer): HTMLDivElement | null {
  const unitPrice = beer.price_per_alcohol_unit;
  if (unitPrice === null || unitPrice === undefined) return null;
  const el = document.createElement("div");
  el.classList.add("olmono-unit-price");
  el.dataset.olmono = String(beer.vmp_id);
  el.title = "Pris per alkoholenhet";
  el.textContent = `${formatNumber(unitPrice)} kr/alkoholenhet`;
  return el;
}

function setLabelImage(img: HTMLImageElement, url: string): void {
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
  img.src = url;
}

function vmpImageMissing(vmpId: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () =>
      resolve(probe.naturalWidth > 150 || probe.naturalHeight > 150);
    probe.onerror = () => resolve(true);
    probe.src = `${VMP_IMAGE_CACHE}/150x150-0/${vmpId}-1.jpg`;
  });
}

export function applyLabelImage(
  root: ParentNode,
  beer: Beer,
  mode: LabelImageMode,
): void {
  if (mode === "off") return;
  const url = beer.label_hd_url ?? beer.label_sm_url;
  if (!url) return;
  const img = find<HTMLImageElement>("productImage", root);
  if (!img) return;

  if (mode === "override") {
    setLabelImage(img, url);
    return;
  }

  void vmpImageMissing(beer.vmp_id).then((missing) => {
    if (missing) setLabelImage(img, url);
  });
}
