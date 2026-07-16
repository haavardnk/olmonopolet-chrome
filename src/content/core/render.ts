import { productUrl } from "../../shared/constants";
import { ratingToStars } from "../../shared/format";
import type { Beer, Badge } from "../../shared/types";
import type { LabelImageMode } from "../../shared/settings";
import { SELECTORS, queryFirst } from "../dom/selectors";

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

function valueLevel(score: number): string {
  if (score >= 15) return "success";
  if (score >= 10) return "info";
  if (score >= 5) return "warning";
  return "error";
}

export function renderValueScore(beer: Beer): HTMLSpanElement | null {
  const score = beer.value_score;
  if (score === null || score === undefined) return null;

  const track = document.createElement("span");
  track.classList.add("olmono-value", `olmono-value--${valueLevel(score)}`);
  track.title = "Verdi for pengene — basert på vurdering og literpris";

  const fill = document.createElement("span");
  fill.classList.add("olmono-value-fill");
  fill.style.width = `${(Math.min(score, 20) / 20) * 100}%`;
  track.appendChild(fill);

  return track;
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
    probe.src = `https://bilder.vinmonopolet.no/cache/150x150-0/${vmpId}-1.jpg`;
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
  const img = queryFirst<HTMLImageElement>(root, SELECTORS.productImage);
  if (!img) return;

  if (mode === "override") {
    setLabelImage(img, url);
    return;
  }

  void vmpImageMissing(beer.vmp_id).then((missing) => {
    if (missing) setLabelImage(img, url);
  });
}
