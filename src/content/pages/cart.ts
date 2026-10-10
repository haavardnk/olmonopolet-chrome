import { findProductCards } from "../dom/product";
import { processCards, showSummary } from "./shared";

export async function handleCart(signal?: AbortSignal): Promise<void> {
  const beers = await processCards(findProductCards(), { signal });
  await showSummary(beers, signal);
}
