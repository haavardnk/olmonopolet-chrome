import { API_BASE_URL } from "../../shared/constants";
import type { Beer, BeerListResponse, UserList } from "../../shared/types";
import { authFetch } from "./authFetch";

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_LIST_FIELDS =
  "vmp_id,rating,untpd_url,badges,value_score,label_hd_url,user_tasted";
const DEFAULT_BEER_FIELDS =
  "vmp_id,ibu,style,rating,checkins,untpd_url,untpd_updated,badges,value_score,price_per_alcohol_unit,alcohol_units,label_sm_url,label_hd_url,user_tasted";

const cache = new Map<string, Beer>();

function cacheKey(id: string | number, fields: string): string {
  return `${id}:${fields}`;
}

async function fetchJson<T>(
  url: string,
  timeout = DEFAULT_TIMEOUT,
  retries = 1,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await authFetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      if (attempt >= retries) throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function getBeers(
  ids: (string | number)[],
  fields = DEFAULT_LIST_FIELDS,
): Promise<Map<string, Beer>> {
  const missing = ids.filter((id) => !cache.has(cacheKey(id, fields)));

  if (missing.length > 0) {
    const url = `${API_BASE_URL}/beers/?beers=${missing.join()}&fields=${fields}`;
    const data = await fetchJson<BeerListResponse>(url);
    data.results?.forEach((beer) => {
      cache.set(cacheKey(beer.vmp_id, fields), beer);
    });
  }

  const result = new Map<string, Beer>();
  ids.forEach((id) => {
    const beer = cache.get(cacheKey(id, fields));
    if (beer) result.set(String(id), beer);
  });
  return result;
}

export async function getBeer(
  id: string | number,
  fields = DEFAULT_BEER_FIELDS,
): Promise<Beer> {
  const key = cacheKey(id, fields);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `${API_BASE_URL}/beers/${id}/?fields=${fields}`;
  const data = await fetchJson<Beer>(url);
  cache.set(key, data);
  return data;
}

export function clearBeerCache(): void {
  cache.clear();
}

export async function markTasted(
  id: string | number,
  tasted: boolean,
): Promise<boolean> {
  const res = await authFetch(`${API_BASE_URL}/beers/${id}/mark_tasted/`, {
    method: tasted ? "POST" : "DELETE",
  });
  return res.ok;
}

let listsCache: UserList[] | null = null;

export async function getLists(force = false): Promise<UserList[]> {
  if (listsCache && !force) return listsCache;
  try {
    const res = await authFetch(`${API_BASE_URL}/lists/`);
    if (!res.ok) return listsCache ?? [];
    const data = (await res.json()) as UserList[] | { results?: UserList[] };
    listsCache = Array.isArray(data) ? data : (data.results ?? []);
    return listsCache;
  } catch {
    return listsCache ?? [];
  }
}

export async function addToList(
  listId: number | string,
  productId: string,
): Promise<boolean> {
  const res = await authFetch(`${API_BASE_URL}/lists/${listId}/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  return res.ok;
}

export async function removeFromList(
  listId: number | string,
  productId: string,
): Promise<boolean> {
  const res = await authFetch(
    `${API_BASE_URL}/lists/${listId}/products/${productId}/`,
    { method: "DELETE" },
  );
  return res.ok;
}

export function clearListsCache(): void {
  listsCache = null;
}
