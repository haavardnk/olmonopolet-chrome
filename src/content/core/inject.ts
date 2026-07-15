const MARK = "data-olmono";

export function alreadyInjected(container: Element, id: string): boolean {
  return container.querySelector(`:scope > [${MARK}="${id}"]`) !== null;
}

export function injectRating(
  container: Element,
  id: string,
  node: HTMLElement,
): boolean {
  if (alreadyInjected(container, id)) return false;
  node.setAttribute(MARK, id);
  container.appendChild(node);
  return true;
}
