import type { Beer } from "../../shared/types";
import type { SearchResult } from "./protocol";

interface Named {
  code?: string;
  name?: string;
}

interface Measure {
  formattedValue: string;
  readableValue: string;
  value: number;
}

export interface VmpProduct {
  code: string;
  main_category?: Named;
  [key: string]: unknown;
}

interface VmpPagination {
  totalPages?: number;
  totalResults?: number;
  [key: string]: unknown;
}

export interface VmpSearch {
  productSearchResult?: {
    products?: VmpProduct[];
    pagination?: VmpPagination;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const VMP_ORIGIN = "https://www.vinmonopolet.no";
const IMAGE_CACHE = "https://bilder.vinmonopolet.no/cache";

function decimal(value: number, max: number, min = 0): string {
  return value.toLocaleString("nb-NO", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "_");
}

function named(name: string | null | undefined, code?: string): Named {
  return name ? { code: code ?? slug(name), name } : {};
}

function price(value: number): Measure {
  const kroner = Math.floor(value);
  const ore = Math.round((value - kroner) * 100);
  return {
    formattedValue: `Kr\u00a0${decimal(value, 2, 2)}`,
    readableValue: ore ? `${kroner} kroner og ${ore} øre` : `${kroner} kroner`,
    value,
  };
}

function volume(litres: number): Measure {
  const cl = Math.round(litres * 1000) / 10;
  return {
    formattedValue: `${decimal(cl, 1)} cl`,
    readableValue: `${decimal(cl, 1)} centiliter`,
    value: cl,
  };
}

function alcohol(abv: number): Measure {
  return {
    formattedValue: `${decimal(abv, 1)}%`,
    readableValue: `${decimal(abv, 1)} prosent`,
    value: abv,
  };
}

function productPath(beer: Beer): string {
  const url = beer.vmp_url;
  return url?.startsWith(`${VMP_ORIGIN}/`)
    ? url.slice(VMP_ORIGIN.length)
    : `/p/${beer.vmp_id}`;
}

function availability(beer: Beer): Record<string, unknown> {
  const post = beer.post_delivery === true;
  const delivery = post ? "Kan bestilles" : "Kan ikke bestilles";
  const stores =
    beer.store_delivery === true
      ? "Kan bestilles til alle butikker"
      : "Kan kjøpes i butikk med varen på lager";
  return {
    deliveryAvailability: {
      availableForPurchase: post,
      infos: [
        {
          availability: delivery,
          location: "Post/Levering",
          readableValue: `Post/Levering: ${delivery}`,
        },
      ],
      openStockLocator: false,
    },
    storesAvailability: {
      availableForPurchase: true,
      infoAvailabilityAllStores: "Vis butikker med varen på lager",
      infos: [{ availability: stores, readableValue: stores }],
      openStockLocator: true,
    },
  };
}

export function toVmpProduct(beer: Beer): VmpProduct | null {
  if (beer.price == null || beer.volume == null || beer.vmp_abv == null)
    return null;
  const code = String(beer.vmp_id);
  const main = named(beer.main_category);
  return {
    code,
    name: beer.vmp_name ?? code,
    url: productPath(beer),
    images: [
      {
        format: "thumbnail",
        imageType: "PRIMARY",
        url: `${IMAGE_CACHE}/96x96-0/${code}-1.jpg`,
      },
      {
        format: "product",
        imageType: "PRIMARY",
        url: `${IMAGE_CACHE}/300x300-0/${code}-1.jpg`,
      },
    ],
    main_category: main,
    main_sub_category: named(
      beer.sub_category,
      main.code && beer.sub_category
        ? `${main.code}_${slug(beer.sub_category)}`
        : undefined,
    ),
    main_country: named(beer.country),
    district: {},
    sub_District: {},
    price: price(beer.price),
    volume: volume(beer.volume),
    alcohol: alcohol(beer.vmp_abv),
    productAvailability: availability(beer),
    product_selection: beer.product_selection ?? "",
    buyable: true,
    expired: false,
    releaseMode: false,
    status: "aktiv",
    sustainable: false,
  };
}

export function rewriteSearch(
  search: VmpSearch,
  result: SearchResult,
  pageSize: number,
): VmpSearch {
  const current = search.productSearchResult;
  if (!current) return search;
  const live = new Map(
    (current.products ?? []).map((product) => [product.code, product]),
  );
  const products = result.beers.flatMap((beer) => {
    const product = live.get(String(beer.vmp_id)) ?? toVmpProduct(beer);
    return product ? [product] : [];
  });
  return {
    ...search,
    productSearchResult: {
      ...current,
      products,
      pagination: {
        ...current.pagination,
        totalResults: result.count,
        totalPages: Math.ceil(result.count / pageSize),
      },
    },
  };
}
