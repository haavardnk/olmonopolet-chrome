import {
  DEFAULT_ANCHORS,
  type AnchorMap,
  type AnchorName,
  type Strategy,
} from "../../shared/anchorConfig";

let anchors: AnchorMap = DEFAULT_ANCHORS;

export function setAnchors(overrides: Partial<AnchorMap>): void {
  anchors = { ...DEFAULT_ANCHORS, ...overrides };
}

function climb(el: Element, up: number): Element | null {
  let current: Element | null = el;
  for (let i = 0; i < up && current; i++) current = current.parentElement;
  return current;
}

function resolve(root: ParentNode, strategy: Strategy): Element[] {
  let matches: Element[];
  try {
    matches = [...root.querySelectorAll(strategy.css)];
  } catch {
    return [];
  }
  if (strategy.text !== undefined) {
    matches = matches.filter((el) => el.textContent?.trim() === strategy.text);
  }
  const found = matches
    .map((el) => climb(el, strategy.up ?? 0))
    .filter((el): el is Element => el !== null);
  return [...new Set(found)];
}

export function find<E extends Element = Element>(
  name: AnchorName,
  root: ParentNode = document,
): E | null {
  for (const strategy of anchors[name]) {
    const [el] = resolve(root, strategy);
    if (el) return el as E;
  }
  return null;
}

export function findAll<E extends Element = Element>(
  name: AnchorName,
  root: ParentNode = document,
): E[] {
  for (const strategy of anchors[name]) {
    const els = resolve(root, strategy);
    if (els.length > 0) return els as E[];
  }
  return [];
}

export function missing(
  names: AnchorName[],
  root: ParentNode = document,
): AnchorName[] {
  return names.filter((name) => find(name, root) === null);
}

export function waitForAnchor(
  name: AnchorName,
  { timeout = 10000, signal }: { timeout?: number; signal?: AbortSignal } = {},
): Promise<Element | null> {
  const existing = find(name);
  if (existing || signal?.aborted) return Promise.resolve(existing);

  return new Promise((done) => {
    const finish = (el: Element | null): void => {
      clearTimeout(timer);
      obs.disconnect();
      signal?.removeEventListener("abort", onAbort);
      done(el);
    };
    const onAbort = (): void => finish(null);
    const obs = new MutationObserver(() => {
      const el = find(name);
      if (el) finish(el);
    });
    const timer = setTimeout(() => finish(null), timeout);
    signal?.addEventListener("abort", onAbort);
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}
