import type { Beer, Brewery, Release } from "../../shared/types";
import { formatDate } from "../../shared/format";
import { productUrl } from "../../shared/constants";
import { externalLink, renderBadges, renderRating } from "./render";
import { addFact, addSummaryFacts } from "./facts";
import { logo } from "./icons";

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
  footer.appendChild(link);
  return footer;
}

export function renderPanel(beer: Beer, id: string): HTMLElement {
  const panel = document.createElement("section");
  panel.classList.add("olmono-panel");
  panel.dataset.olmono = id;
  panel.setAttribute("aria-label", "Ølmonopolet");

  const title = document.createElement("h5");
  title.classList.add("olmono-panel-title");
  title.append(logo(20), "Ølmonopolet");
  panel.appendChild(title);

  const score = renderRating(beer, true);
  score.classList.add("olmono-panel-score");
  panel.appendChild(score);

  if (beer.description) panel.appendChild(renderDescription(beer.description));

  const facts = renderFacts(beer);
  if (facts.childElementCount > 0) panel.appendChild(facts);

  if (beer.brewery_details?.description) {
    panel.appendChild(renderBrewery(beer.brewery_details));
  }

  const badges = renderBadges(beer.badges);
  if (badges) panel.appendChild(badges);

  panel.appendChild(renderFooter(beer, id));
  return panel;
}
