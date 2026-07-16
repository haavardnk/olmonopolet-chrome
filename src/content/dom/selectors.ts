export const SELECTORS = {
  productCard: ["ul.product-list > li"],
  productLink: ['a[href*="/p/"]'],
  productName: [".product__name"],
  categoryName: [".product__category-name"],
  productLayoutWrapper: [".product__layout-wrapper"],
  productDetailsMain: [".product-details-main"],
  productImage: [
    'img[alt^="Bilde"]',
    'a[href*="/p/"] img',
    ".product__image img",
    "picture img",
  ],
} as const;

export function queryFirst<E extends Element = Element>(
  root: ParentNode,
  selectors: readonly string[],
): E | null {
  for (const sel of selectors) {
    const el = root.querySelector<E>(sel);
    if (el) return el;
  }
  return null;
}

export function queryAll<E extends Element = Element>(
  root: ParentNode,
  selectors: readonly string[],
): E[] {
  for (const sel of selectors) {
    const els = root.querySelectorAll<E>(sel);
    if (els.length > 0) return [...els];
  }
  return [];
}
