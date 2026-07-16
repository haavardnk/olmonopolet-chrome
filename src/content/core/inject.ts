const MARK = "data-olmono";
const SKELETON = "olmono-skeleton";

export function alreadyInjected(container: Element, id: string): boolean {
  return container.querySelector(`:scope > [${MARK}="${id}"]`) !== null;
}

export function injectSkeleton(
  container: Element,
  id: string,
  node: HTMLElement,
): void {
  if (alreadyInjected(container, id)) return;
  node.setAttribute(MARK, id);
  container.appendChild(node);
}

export function injectRating(
  container: Element,
  id: string,
  node: HTMLElement,
): boolean {
  node.setAttribute(MARK, id);
  const existing = container.querySelector(`:scope > [${MARK}="${id}"]`);
  if (existing) {
    if (!existing.classList.contains(SKELETON)) return false;
    existing.replaceWith(node);
    return true;
  }
  container.appendChild(node);
  return true;
}

export function removeSkeleton(container: Element, id: string): void {
  const existing = container.querySelector(`:scope > [${MARK}="${id}"]`);
  if (existing?.classList.contains(SKELETON)) existing.remove();
}
