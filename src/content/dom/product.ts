import { BEER_CATEGORIES } from "../../shared/constants";
import { find, findAll } from "./anchors";

const PRODUCT_ID_RE = /\/p\/(\d+)/;

export function getProductId(product: ParentNode): string | null {
  const link =
    find<HTMLAnchorElement>("productLink", product) ??
    product.querySelector<HTMLAnchorElement>("a[aria-label]");
  const href = link?.getAttribute("href") ?? link?.href ?? "";
  const match = href.match(PRODUCT_ID_RE);
  return match ? match[1] : null;
}

export function getProductIdFromUrl(
  url: string = window.location.pathname,
): string | null {
  const match = url.match(PRODUCT_ID_RE);
  return match ? match[1] : null;
}

export function findProductCards(root: ParentNode = document): Element[] {
  return findAll("productCard", root);
}

export function getCategoryText(product: ParentNode): string {
  const parts: string[] = [];
  const cat = find("category", product);
  if (cat?.textContent) parts.push(cat.textContent);
  const link = product.querySelector<HTMLAnchorElement>("a[aria-label]");
  const label = link?.getAttribute("aria-label");
  if (label) parts.push(label);
  return parts.join(" ");
}

export function isBeer(product: ParentNode): boolean {
  const upper = getCategoryText(product).toUpperCase();
  return BEER_CATEGORIES.some((cat) => upper.includes(cat));
}

export function getInfoContainer(product: Element): Element {
  const cat = find("category", product);
  if (cat?.parentElement) return cat.parentElement;

  const h3 = product.querySelector("h3");
  if (h3) {
    let el: Element = h3;
    while (el.parentElement && el.parentElement !== product) {
      el = el.parentElement;
    }
    return el;
  }

  return product;
}

export function appendStyleToCategory(product: Element, style: string): void {
  const cat = find("category", product);
  if (!cat || cat.textContent?.includes(" - ")) return;
  cat.append(` - ${style}`);
}
