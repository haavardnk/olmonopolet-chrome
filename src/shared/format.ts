import { Star, StarHalf, type IconNode } from "lucide";

const SVG_NS = "http://www.w3.org/2000/svg";
const STAR_YELLOW = "#facc15";
const STAR_GRAY = "#d1d5db";

export function kFormatter(num: number): string {
  return Math.abs(num) > 999 ? (num / 1000).toFixed(0) + "k" : String(num);
}

function buildIcon(
  node: IconNode,
  color: string,
  filled: boolean,
  size: number,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", filled ? color : "none");
  svg.setAttribute("stroke", color);
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  for (const [tag, attrs] of node) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      child.setAttribute(key, String(value));
    }
    svg.appendChild(child);
  }
  return svg;
}

export function ratingToStars(rating: number, size = 20): HTMLSpanElement {
  const container = document.createElement("span");
  container.classList.add("stars");

  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  for (let i = 0; i < full; i++) {
    container.appendChild(buildIcon(Star, STAR_YELLOW, true, size));
  }
  if (hasHalf) {
    container.appendChild(buildIcon(StarHalf, STAR_YELLOW, true, size));
  }
  for (let i = 0; i < empty; i++) {
    container.appendChild(buildIcon(Star, STAR_GRAY, false, size));
  }

  return container;
}

export function formatUpdated(dateStr: string): string {
  const date = new Date(dateStr);
  return `Oppdatert: ${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB")}`;
}
