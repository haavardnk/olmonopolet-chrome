import { find } from "../dom/anchors";
import { findProductCards } from "../dom/product";
import { processCards, showSummary } from "./cards";

function quantityLine(container: Element): Element | null {
  const input = find("cartQuantity", container);
  if (!input) return null;
  return [...container.children].find((el) => el.contains(input)) ?? null;
}

function cartTools(card: Element): Element | null {
  const remove = find("cartRemove", card);
  if (!remove?.parentElement) return null;
  const existing = remove.parentElement.querySelector(
    ":scope > .olmono-cart-tools",
  );
  if (existing) return existing;
  const tools = document.createElement("div");
  tools.classList.add("olmono-cart-tools");
  remove.before(tools);
  return tools;
}

export async function handleCart(signal?: AbortSignal): Promise<void> {
  const beers = await processCards(findProductCards(), {
    signal,
    rowBefore: quantityLine,
    tools: cartTools,
  });
  await showSummary(beers, signal);
}
