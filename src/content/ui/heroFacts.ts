import type { Beer } from "../../shared/types";
import { addSummaryFacts } from "./facts";
import { renderRating } from "./render";

export function renderHeroFacts(beer: Beer, id: string): HTMLElement | null {
  const facts = document.createElement("dl");
  facts.classList.add("olmono-facts");
  addSummaryFacts(facts, beer);
  if (facts.childElementCount === 0) return null;

  const hero = document.createElement("aside");
  hero.classList.add("olmono-hero");
  hero.dataset.olmono = id;
  hero.setAttribute("aria-label", "Ølmonopolet");
  const title = document.createElement("h5");
  title.classList.add("olmono-panel-title");
  title.textContent = "Ølmonopolet";
  const score = renderRating(beer, true);
  score.classList.add("olmono-panel-score");
  hero.append(title, score, facts);
  return hero;
}
