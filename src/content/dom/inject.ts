const MARK = "data-olmono";
const SKELETON = "olmono-skeleton";

export function alreadyInjected(container: Element, id: string): boolean {
  return container.querySelector(`:scope > [${MARK}="${id}"]`) !== null;
}

export function sweepStale(root: ParentNode, id: string): void {
  for (const el of root.querySelectorAll<HTMLElement>(`[${MARK}]`)) {
    if (el.getAttribute(MARK) !== id) el.remove();
  }
}

export function injectSkeleton(
  container: Element,
  id: string,
  node: HTMLElement,
  before: Element | null = null,
): void {
  if (alreadyInjected(container, id)) return;
  node.setAttribute(MARK, id);
  container.insertBefore(node, before);
}

export function injectRating(
  container: Element,
  id: string,
  node: HTMLElement,
  before: Element | null = null,
): boolean {
  node.setAttribute(MARK, id);
  const existing = container.querySelector(`:scope > [${MARK}="${id}"]`);
  if (existing) {
    if (!existing.classList.contains(SKELETON)) return false;
    existing.replaceWith(node);
    return true;
  }
  container.insertBefore(node, before);
  return true;
}

export function removeSkeleton(container: Element, id: string): void {
  const existing = container.querySelector(`:scope > [${MARK}="${id}"]`);
  if (existing?.classList.contains(SKELETON)) existing.remove();
}
