export interface Strategy {
  css: string;
  text?: string;
  up?: number;
}

export const ANCHOR_NAMES = [
  "productList",
  "productCard",
  "productLink",
  "category",
  "productImage",
  "tools",
  "searchResults",
  "sortSelect",
  "emptyResults",
  "detailPage",
  "detailColumns",
  "detailFacts",
  "detailPerLiter",
] as const;

export type AnchorName = (typeof ANCHOR_NAMES)[number];

export type AnchorMap = Record<AnchorName, Strategy[]>;

export const CONFIG_SCHEMA = 1;

export const DEFAULT_ANCHORS: AnchorMap = {
  productList: [{ css: "ul.product-list" }],
  productCard: [{ css: "ul.product-list > li" }],
  productLink: [{ css: 'a[href*="/p/"]' }],
  category: [
    { css: 'p[data-track-link-click="product-categories"]' },
    { css: ".product__category-name" },
  ],
  productImage: [
    { css: 'img[alt^="Bilde"]' },
    { css: 'a[href*="/p/"] img' },
    { css: "picture img" },
  ],
  tools: [
    { css: 'button[aria-label="Min liste"]', up: 1 },
    { css: 'button[aria-label^="Gi produkt"]', up: 1 },
  ],
  searchResults: [
    { css: "#search-results" },
    { css: "ul.product-list", up: 1 },
  ],
  sortSelect: [{ css: 'select:has(option[value="relevance"])' }],
  emptyResults: [
    { css: "main *", text: "Vi fant ingen varer som passer til dette søket" },
  ],
  detailPage: [
    { css: 'main[data-react-component*="/p/"]' },
    { css: "li > span", text: "Varenummer", up: 2 },
  ],
  detailColumns: [
    { css: "div.dDnT0pW8" },
    { css: "h2.sr-only", text: "Karakteristikk", up: 3 },
    { css: "h2.sr-only", text: "Passer til", up: 3 },
  ],
  detailFacts: [{ css: "li > span", text: "Varenummer", up: 2 }],
  detailPerLiter: [{ css: '[aria-label*="per liter"]' }],
};
