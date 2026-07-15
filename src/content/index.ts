import type { PageType } from "../shared/types";
import { detectPage } from "./router";
import { handleSearch } from "./pages/search";
import { handleDetails } from "./pages/details";
import { handleCart } from "./pages/cart";
import { handleWishlist } from "./pages/wishlist";
import { observeMutations, onRouteChange } from "./core/observer";

const HANDLERS: Record<Exclude<PageType, "unknown">, () => Promise<void>> = {
  search: handleSearch,
  details: handleDetails,
  cart: handleCart,
  wishlist: handleWishlist,
};

function run(): void {
  const page = detectPage();
  if (page === "unknown") return;
  void HANDLERS[page]().catch((err) => console.error("[olmono]", err));
}

run();
observeMutations(run, { debounce: 300 });
onRouteChange(() => setTimeout(run, 300));
