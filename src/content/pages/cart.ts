import { findProductCards } from "../dom/product";
import { processCards } from "./shared";

export async function handleCart(signal?: AbortSignal): Promise<void> {
  await processCards(findProductCards(), { signal });
}
