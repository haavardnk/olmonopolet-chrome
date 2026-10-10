import { findProductCards } from "../dom/product";
import { processCards, showSummary } from "./cards";

export async function handleWishlist(signal?: AbortSignal): Promise<void> {
  const beers = await processCards(findProductCards(), {
    beersOnly: true,
    signal,
  });
  await showSummary(beers, signal);
}
