import type { PageType } from "../shared/types";
import { find } from "./dom/anchors";
import { getProductIdFromUrl } from "./dom/product";

export function isSearchPath(path: string = location.pathname): boolean {
  return path.startsWith("/search");
}

export function detectPage(path: string = location.pathname): PageType {
  if (getProductIdFromUrl(path)) return "details";
  if (path.includes("/cart")) return "cart";
  if (path.includes("/wishlist")) return "wishlist";
  if (isSearchPath(path) || find("productList")) return "search";
  return "unknown";
}
