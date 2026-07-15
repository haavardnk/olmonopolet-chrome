import type { PageType } from "../shared/types";
import { getProductIdFromUrl } from "./dom/product";

export function detectPage(): PageType {
  const path = location.pathname;

  if (
    getProductIdFromUrl(path) &&
    document.querySelector(".product-details-main")
  ) {
    return "details";
  }
  if (path.includes("/cart")) return "cart";
  if (path.includes("/wishlist")) return "wishlist";
  if (document.querySelector("ul.product-list")) return "search";
  return "unknown";
}
