import type { AnchorName } from "../shared/anchorConfig";
import type { HealthPage } from "../shared/health";
import { isSearchPath, detectPage } from "./router";
import { find, findAll, missing, waitForAnchor } from "./dom/anchors";
import { checkHealth, recordHealth } from "./core/health";
import { handleSearch } from "./pages/search";
import { handleDetails } from "./pages/details";
import { handleCart } from "./pages/cart";
import { handleWishlist } from "./pages/wishlist";

const HANDLERS: Record<HealthPage, (signal: AbortSignal) => Promise<void>> = {
  search: handleSearch,
  details: handleDetails,
  cart: handleCart,
  wishlist: handleWishlist,
};

function cardMissing(names: AnchorName[]): AnchorName[] {
  const [card] = findAll("productCard");
  return card ? missing(names, card) : [];
}

export const HEALTH_CHECKS: Record<HealthPage, () => AnchorName[]> = {
  search: () => {
    const page = missing(["sortSelect"]);
    if (findAll("productCard").length === 0) {
      return find("emptyResults") ? page : [...page, "productCard"];
    }
    return [
      ...page,
      ...cardMissing(["productLink", "category", "tools", "productImage"]),
    ];
  },
  details: () =>
    missing([
      "category",
      "tools",
      "detailColumns",
      "detailFacts",
      "productImage",
    ]),
  cart: () => cardMissing(["productLink"]),
  wishlist: () => cardMissing(["productLink", "category"]),
};

function readyAnchor(page: HealthPage): AnchorName | null {
  if (page === "details") return "detailPage";
  if (page === "search" && isSearchPath()) return "sortSelect";
  return null;
}

export async function run(signal: AbortSignal): Promise<void> {
  const page = detectPage();
  if (page === "unknown") return;

  const ready = readyAnchor(page);
  if (ready && !(await waitForAnchor(ready, { signal }))) {
    if (!signal.aborted) await recordHealth(page, [ready]);
    return;
  }
  if (signal.aborted) return;

  await HANDLERS[page](signal);
  if (signal.aborted) return;
  if (page !== "search" || isSearchPath()) {
    checkHealth(page, HEALTH_CHECKS[page]);
  }
}
