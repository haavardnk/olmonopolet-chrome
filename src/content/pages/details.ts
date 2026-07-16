import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import type { Beer } from "../../shared/types";
import { getBeer } from "../api/client";
import { getProductIdFromUrl } from "../dom/product";
import { queryFirst, SELECTORS } from "../dom/selectors";
import { ratingToStars, kFormatter, formatUpdated } from "../../shared/format";
import {
  productUrl,
  API_BASE_URL,
  BEER_CATEGORIES,
} from "../../shared/constants";
import { retryUntil } from "../core/observer";
import { getSettings } from "../../shared/settings";
import { renderValueScore, applyLabelImage } from "../core/render";

interface Block {
  container: HTMLDivElement;
  rating: HTMLDivElement;
  link: HTMLAnchorElement;
  updated: HTMLParagraphElement;
  wrong: HTMLAnchorElement;
}

function isBeerCategory(text: string | null | undefined): boolean {
  if (!text) return false;
  const upper = text.toUpperCase();
  return BEER_CATEGORIES.some((cat) => upper.includes(cat));
}

function buildBlock(): Block {
  const container = document.createElement("div");
  container.classList.add("untappd");

  const rating = document.createElement("div");
  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const updated = document.createElement("p");
  const wrong = document.createElement("a");
  wrong.classList.add("suggest");

  rating.appendChild(link);
  container.append(rating, updated, wrong);
  return { container, rating, link, updated, wrong };
}

function findDetailsList(): Element | null {
  for (const li of document.querySelectorAll("li")) {
    const spans = li.querySelectorAll(":scope > span");
    if (spans.length >= 2 && spans[0].textContent?.trim() === "Varenummer") {
      return li.parentElement;
    }
  }
  return null;
}

function injectIBU(beer: Beer, category: Element): boolean {
  if (!beer.ibu) return true;
  if (!isBeerCategory(category.textContent)) return true;

  const list = findDetailsList();
  if (!list) return false;

  const hasIBU = [...list.querySelectorAll("li")].some((li) => {
    const spans = li.querySelectorAll(":scope > span");
    return spans.length >= 1 && spans[0].textContent?.trim() === "Ibu";
  });
  if (hasIBU) return true;

  const template = list.querySelector("li");
  if (!template) return false;

  const item = template.cloneNode(true) as HTMLElement;
  const spans = item.querySelectorAll("span");
  if (spans.length >= 2) {
    spans[0].textContent = "Ibu";
    spans[1].textContent = String(beer.ibu);
    spans[1].removeAttribute("aria-label");
  }
  list.appendChild(item);
  return true;
}

function updateStyle(beer: Beer, category: Element): void {
  if (!beer.style || category.textContent?.includes("(")) return;
  if (!isBeerCategory(category.textContent)) return;

  const span = document.createElement("span");
  span.textContent = ` (${beer.style})`;
  category.appendChild(span);
}

function injectStyleToVaretype(beer: Beer): boolean {
  if (!beer.style) return true;

  const list = findDetailsList();
  if (!list) return false;

  const row = [...list.querySelectorAll("li")].find((li) => {
    const spans = li.querySelectorAll(":scope > span");
    return spans.length >= 2 && spans[0].textContent?.trim() === "Varetype";
  });
  if (!row) return true;

  const value = row.querySelectorAll<HTMLElement>(":scope > span")[1];
  if (!value || value.dataset.olmonoStyle) return true;

  value.textContent = `${value.textContent} (${beer.style})`;
  value.dataset.olmonoStyle = "1";
  return true;
}

function findAlcoholRow(): HTMLElement | null {
  for (const li of document.querySelectorAll<HTMLElement>("li")) {
    const strong = li.querySelector(":scope > strong");
    if (strong?.textContent?.trim() === "Alkohol") return li;
  }
  return null;
}

function injectAlcoholUnits(beer: Beer): boolean {
  if (beer.alcohol_units === null || beer.alcohol_units === undefined)
    return true;

  const row = findAlcoholRow();
  if (!row?.parentElement) return false;

  const exists = [...row.parentElement.children].some((li) => {
    const strong = li.querySelector(":scope > strong");
    return strong?.textContent?.trim() === "Alkoholenheter";
  });
  if (exists) return true;

  const clone = row.cloneNode(true) as HTMLElement;
  const strong = clone.querySelector(":scope > strong");
  const span = clone.querySelector(":scope > span");
  if (!strong || !span) return true;
  strong.textContent = "Alkoholenheter";
  span.textContent = beer.alcohol_units.toFixed(1).replace(".", ",");
  span.removeAttribute("aria-label");
  row.insertAdjacentElement("afterend", clone);
  return true;
}

function injectPpau(beer: Beer): boolean {
  const value = beer.price_per_alcohol_unit;
  if (value === null || value === undefined) return true;

  const container = document.querySelector(".volume-and-cost_per_unit");
  if (!container) return false;
  if (container.querySelector(".olmono-ppau")) return true;

  const span = document.createElement("span");
  span.classList.add("olmono-ppau");
  span.textContent = `${Math.round(value)} kr/alkoholenhet`;
  container.appendChild(span);
  return true;
}

function injectExtraInfo(beer: Beer, category: Element): void {
  updateStyle(beer, category);
  void retryUntil(() => injectIBU(beer, category), {
    attempts: 20,
    delay: 300,
  });
  void retryUntil(() => injectStyleToVaretype(beer), {
    attempts: 20,
    delay: 300,
  });
}

function addBadges(beer: Beer, layout: Element): void {
  if (!beer.badges?.length || layout.querySelector(".badges")) return;

  for (const badge of beer.badges) {
    const div = document.createElement("div");
    div.classList.add("badges");
    const span = document.createElement("span");
    span.textContent = badge.text;
    div.appendChild(span);
    layout.appendChild(div);
  }
}

function setupWrongMatch(wrong: HTMLAnchorElement, id: string): void {
  wrong.addEventListener("click", (e) => {
    e.preventDefault();
    void Swal.fire({
      title: "Rapporter feil Untappd match",
      text: "Legg inn riktig Untappd link. Eksempel: https://untappd.com/b/nogne-o-porter/27638",
      input: "text",
      inputAttributes: { autocapitalize: "off" },
      showCancelButton: false,
      confirmButtonText: "Send",
      confirmButtonColor: "#002025",
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        void fetch(`${API_BASE_URL}/wrongmatch/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beer: id, suggested_url: result.value }),
        }).then((response) => {
          const success = response.status === 201;
          void Swal.fire({
            title: success
              ? "Feil registrert!"
              : "Det oppsto en feil ved sending av forslaget...",
            text: success
              ? "Ditt endringsforslag vil bli evaluert. Takk for hjelpen!"
              : "Sjekk at du har tastet inn en gyldig URL!",
            icon: success ? "success" : "error",
            confirmButtonColor: "#002025",
          });
        });
      } else if (result.isConfirmed && !result.value) {
        void Swal.fire({
          title: "Du må oppgi en gyldig Untappd link!",
          text: "Eksempel: https://untappd.com/b/nogne-o-porter/27638",
          icon: "error",
          confirmButtonColor: "#002025",
        });
      }
    });
  });
}

export async function handleDetails(): Promise<void> {
  const detailsMain = queryFirst(document, SELECTORS.productDetailsMain);
  const layout = queryFirst(document, SELECTORS.productLayoutWrapper);
  const category = queryFirst(document, SELECTORS.categoryName);
  if (!detailsMain || !layout || !category) return;
  if (!isBeerCategory(category.textContent)) return;
  if (detailsMain.querySelector(".untappd")) return;

  const id = getProductIdFromUrl();
  if (!id) return;

  const settings = await getSettings();
  const block = buildBlock();
  detailsMain.appendChild(block.container);

  let beer: Beer;
  try {
    beer = await getBeer(id);
  } catch {
    block.link.textContent = "Feil ved lasting";
    return;
  }

  if (beer.rating !== null && beer.rating !== undefined) {
    block.rating.insertBefore(ratingToStars(beer.rating), block.link);
    block.link.href = productUrl(id);
    block.link.textContent = `${beer.rating.toPrecision(3)} (${kFormatter(
      beer.checkins ?? 0,
    )})`;
    if (beer.untpd_updated) {
      block.updated.textContent = formatUpdated(beer.untpd_updated);
    }
    block.wrong.textContent = "Feil øl?";
    injectExtraInfo(beer, category);
  } else if (beer.detail === "Not found.") {
    block.link.textContent = "Ny, oppdateres ved neste kjøring";
  } else {
    block.link.textContent = "Ingen match";
    block.wrong.textContent = "Foreslå Untappd match";
  }

  const valueScore = renderValueScore(beer);
  if (valueScore) block.rating.appendChild(valueScore);

  void retryUntil(() => injectAlcoholUnits(beer), { attempts: 20, delay: 300 });
  void retryUntil(() => injectPpau(beer), { attempts: 20, delay: 300 });

  applyLabelImage(document, beer, settings.labelImage);

  addBadges(beer, layout);
  setupWrongMatch(block.wrong, id);
}
