import type { PageType } from "../shared/types";
import { find } from "./dom/anchors";
import { getProductIdFromUrl } from "./dom/product";

export function isSearchPath(path: string = location.pathname): boolean {
  return path.startsWith("/search");
}

export function detectPage(
  path: string = location.pathname,
  search: string = location.search,
): PageType {
  if (getProductIdFromUrl(path)) return "details";
  if (path.includes("/cart")) return "cart";
  if (path.includes("/wishlist")) return "wishlist";
  if (isSearchPath(path)) {
    return new URLSearchParams(search).get("searchType") === "content"
      ? "unknown"
      : "search";
  }
  if (find("productList")) return "search";
  return "unknown";
}
