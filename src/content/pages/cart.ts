import { findProductCards } from "../dom/product";
import { processCards } from "./shared";

export async function handleCart(): Promise<void> {
  await processCards(findProductCards(), {});
}
