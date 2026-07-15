import { assetUrl } from "./assets";

const STAR_SOLID = "assets/img/star-solid.svg";
const STAR_HALF = "assets/img/star-half.svg";
const STAR_HOLLOW = "assets/img/star-hollow.svg";

export function kFormatter(num: number): string {
  return Math.abs(num) > 999 ? (num / 1000).toFixed(0) + "k" : String(num);
}

export function ratingToStars(rating: number): HTMLSpanElement {
  const container = document.createElement("span");
  container.classList.add("stars");

  for (let i = 0; i < 5; i++) {
    const star = document.createElement("img");
    if (rating >= i + 0.75) {
      star.src = assetUrl(STAR_SOLID);
    } else if (rating >= i + 0.25) {
      star.src = assetUrl(STAR_HALF);
    } else {
      star.src = assetUrl(STAR_HOLLOW);
    }
    container.appendChild(star);
  }

  return container;
}

export function formatUpdated(dateStr: string): string {
  const date = new Date(dateStr);
  return `Oppdatert: ${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB")}`;
}
