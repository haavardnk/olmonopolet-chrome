import { findProductCards } from "../dom/product";
import { processCards, showSummary } from "./cards";

export async function handleCart(signal?: AbortSignal): Promise<void> {
  const beers = await processCards(findProductCards(), { signal });
  await showSummary(beers, signal);
}
