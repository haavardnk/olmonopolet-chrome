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
  "productPrice",
  "tools",
  "sortSelect",
  "emptyResults",
  "detailPage",
  "detailBuy",
  "detailColumns",
  "detailAside",
  "detailFacts",
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
  productPrice: [
    { css: 'div[aria-hidden="true"]:not(:has(p)):has(> span + span)' },
  ],
  tools: [
    { css: 'button[aria-label="Min liste"]', up: 1 },
    { css: 'button[aria-label^="Gi produkt"]', up: 1 },
  ],
  sortSelect: [{ css: 'select:has(option[value="relevance"])' }],
  emptyResults: [
    { css: "main *", text: "Vi fant ingen varer som passer til dette søket" },
  ],
  detailPage: [
    { css: 'main[data-react-component*="/p/"]' },
    { css: "li > span", text: "Varenummer", up: 2 },
  ],
  detailBuy: [
    { css: 'span[aria-label$=" kroner"]', up: 3 },
    { css: 'form button[type="submit"]', text: "Kjøp", up: 3 },
  ],
  detailColumns: [
    { css: "div.dDnT0pW8" },
    { css: "h2.sr-only", text: "Karakteristikk", up: 3 },
    { css: "h2.sr-only", text: "Passer til", up: 3 },
  ],
  detailAside: [{ css: "h5", text: "Bærekraft", up: 2 }],
  detailFacts: [{ css: "li > span", text: "Varenummer", up: 2 }],
};
