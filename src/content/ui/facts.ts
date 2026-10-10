import type { Beer } from "../../shared/types";
import { formatNumber } from "../../shared/format";
import { renderValueScore } from "./render";

const MIN_STYLE_PEERS = 5;

export function addFact(
  list: HTMLElement,
  label: string,
  value: Node | string,
): HTMLElement {
  const item = document.createElement("div");
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.append(value);
  item.append(dt, dd);
  list.appendChild(item);
  return item;
}

function addSummaryFact(
  list: HTMLElement,
  label: string,
  value: Node | string,
): void {
  addFact(list, label, value).classList.add("olmono-fact--summary");
}

function addValueFacts(list: HTMLElement, beer: Beer): void {
  if (beer.alcohol_units !== null && beer.alcohol_units !== undefined) {
    addSummaryFact(list, "Alkoholenheter", formatNumber(beer.alcohol_units, 1));
  }
  if (
    beer.price_per_alcohol_unit !== null &&
    beer.price_per_alcohol_unit !== undefined
  ) {
    addSummaryFact(
      list,
      "Pris per alkoholenhet",
      `${formatNumber(beer.price_per_alcohol_unit)} kr`,
    );
  }
  const value = renderValueScore(beer);
  if (value) addSummaryFact(list, "Verdi for pengene", value);
}

function priceComparison(cheaperThan: number): string {
  if (cheaperThan >= 100) return "Billigst i stilen";
  if (cheaperThan <= 0) return "Dyrest i stilen";
  return `Billigere enn ${cheaperThan} %`;
}

function addStyleFacts(list: HTMLElement, beer: Beer): void {
  const stats = beer.style_stats;
  if (!stats) return;
  if (stats.rank !== null && stats.rated >= MIN_STYLE_PEERS) {
    addSummaryFact(
      list,
      "Rangering i stilen",
      `Nr. ${stats.rank} av ${stats.rated}`,
    );
  }
  if (stats.cheaper_than !== null && stats.priced >= MIN_STYLE_PEERS) {
    const value = document.createElement("span");
    value.textContent = priceComparison(stats.cheaper_than);
    value.title = `Billigere per alkoholenhet enn ${stats.cheaper_than} % av ølene i samme stil`;
    addSummaryFact(list, "Pris i stilen", value);
  }
}

export function addSummaryFacts(list: HTMLElement, beer: Beer): void {
  if (beer.style) addSummaryFact(list, "Stil", beer.style);
  if (beer.ibu) addSummaryFact(list, "IBU", String(beer.ibu));
  addValueFacts(list, beer);
  addStyleFacts(list, beer);
}
