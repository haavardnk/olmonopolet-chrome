import type { Beer, Brewery, Release } from "../../shared/types";
import { formatDate } from "../../shared/format";
import { productUrl } from "../../shared/constants";
import { externalLink, renderBadges, renderRating } from "./render";
import { addFact, addSummaryFacts } from "./facts";
import { openMatchReport } from "./matchReport";

const CLAMP_LENGTH = 180;

function renderDescription(text: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.classList.add("olmono-panel-text");
  const body = document.createElement("p");
  body.textContent = text;
  wrap.appendChild(body);
  if (text.length <= CLAMP_LENGTH) return wrap;

  body.classList.add("olmono-clamp");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.classList.add("olmono-panel-toggle");
  toggle.textContent = "Vis mer";
  toggle.setAttribute("aria-expanded", "false");
  toggle.addEventListener("click", () => {
    const open = !body.classList.toggle("olmono-clamp");
    toggle.textContent = open ? "Vis mindre" : "Vis mer";
    toggle.setAttribute("aria-expanded", String(open));
  });
  new ResizeObserver(() => {
    toggle.hidden =
      body.classList.contains("olmono-clamp") &&
      body.scrollHeight <= body.clientHeight;
  }).observe(body);
  wrap.appendChild(toggle);
  return wrap;
}

function releaseLabel(release: Release): string {
  if (!release.release_date) return release.name;
  return `${release.name} (${formatDate(release.release_date)})`;
}

function renderBrewery(brewery: Brewery): HTMLElement {
  const details = document.createElement("details");
  details.classList.add("olmono-panel-more");
  const summary = document.createElement("summary");
  summary.textContent = `Om ${brewery.name}`;
  const body = document.createElement("p");
  body.textContent = brewery.description ?? "";
  details.append(summary, body);
  return details;
}

function renderFacts(beer: Beer): HTMLElement {
  const facts = document.createElement("dl");
  facts.classList.add("olmono-facts");
  addSummaryFacts(facts, beer);
  if (beer.releases?.length) {
    addFact(facts, "Lansering", beer.releases.map(releaseLabel).join(", "));
  }
  if (beer.first_seen) {
    addFact(facts, "På Vinmonopolet siden", formatDate(beer.first_seen));
  }
  return facts;
}

function renderFooter(beer: Beer, id: string): HTMLElement {
  const footer = document.createElement("p");
  footer.classList.add("olmono-panel-footer");
  if (beer.untpd_updated) {
    footer.append(`Oppdatert ${formatDate(beer.untpd_updated)} · `);
  }
  const link = externalLink(productUrl(id));
  link.textContent = "Se på Ølmonopolet";
  const matched = beer.rating !== null && beer.rating !== undefined;
  const report = document.createElement("button");
  report.type = "button";
  report.classList.add("olmono-panel-report");
  report.textContent = matched ? "Feil øl?" : "Foreslå match";
  report.addEventListener("click", () => openMatchReport(id, matched));
  footer.append(link, " · ", report);
  return footer;
}

function renderBody(beer: Beer): HTMLElement {
  const body = document.createElement("div");
  body.classList.add("olmono-panel-body");
  if (beer.description) body.appendChild(renderDescription(beer.description));
  if (beer.brewery_details?.description) {
    body.appendChild(renderBrewery(beer.brewery_details));
  }
  const badges = renderBadges(beer.badges);
  if (badges) body.appendChild(badges);
  return body;
}

export function renderPanel(beer: Beer, id: string): HTMLElement {
  const panel = document.createElement("div");
  panel.classList.add("olmono-panel");
  panel.dataset.olmono = id;

  const inner = document.createElement("section");
  inner.classList.add("section__inner-container");
  inner.setAttribute("aria-label", "Ølmonopolet");
  const grid = document.createElement("div");
  grid.classList.add("olmono-panel-grid");
  inner.append(grid, document.createElement("hr"));
  panel.appendChild(inner);

  const head = document.createElement("div");
  head.classList.add("olmono-panel-head");
  const title = document.createElement("h2");
  title.classList.add("olmono-panel-title");
  title.textContent = "Ølmonopolet";
  const score = renderRating(beer, true);
  score.classList.add("olmono-panel-score");
  head.append(title, score);
  grid.appendChild(head);

  const body = renderBody(beer);
  if (body.childElementCount > 0) grid.appendChild(body);

  const facts = renderFacts(beer);
  if (facts.childElementCount > 0) grid.appendChild(facts);

  grid.appendChild(renderFooter(beer, id));
  return panel;
}
