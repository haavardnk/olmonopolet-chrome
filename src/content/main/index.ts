import type { SearchReply, SearchRequest, SearchResult } from "./protocol";
import { rewriteSearch, type VmpSearch } from "./vmpProduct";

const SEARCH_PATH = "/vmpws/v2/vmp/search";
const REQUEST_EVENT = "olmono:search-request";
const REPLY_EVENT = "olmono:search-reply";
const READY_EVENT = "olmono:bridge-ready";
const READY_ATTR = "data-olmono-bridge";
const READY_TIMEOUT = 10_000;
const REPLY_TIMEOUT = 20_000;

let nextId = 0;

function bridgeReady(): Promise<boolean> {
  if (document.documentElement.hasAttribute(READY_ATTR))
    return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      document.removeEventListener(READY_EVENT, onReady);
      resolve(false);
    }, READY_TIMEOUT);
    function onReady(): void {
      clearTimeout(timer);
      resolve(true);
    }
    document.addEventListener(READY_EVENT, onReady, { once: true });
  });
}

function ask(request: SearchRequest): Promise<SearchResult | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(finish, REPLY_TIMEOUT, null);
    function finish(result: SearchResult | null): void {
      clearTimeout(timer);
      document.removeEventListener(REPLY_EVENT, onReply);
      resolve(result);
    }
    function onReply(event: Event): void {
      const reply = JSON.parse(
        String((event as CustomEvent<unknown>).detail),
      ) as SearchReply;
      if (reply.id === request.id) finish(reply.result);
    }
    document.addEventListener(REPLY_EVENT, onReply);
    document.dispatchEvent(
      new CustomEvent(REQUEST_EVENT, { detail: JSON.stringify(request) }),
    );
  });
}

async function sorted(response: Response, url: URL): Promise<Response> {
  const query = url.searchParams.get("query");
  const pageSize = Number(url.searchParams.get("pageSize"));
  if (query === null || !pageSize || !response.ok) return response;
  const search = (await response.clone().json()) as VmpSearch;
  const products = search.productSearchResult?.products;
  if (!products || !(await bridgeReady())) return response;

  const result = await ask({
    id: String(++nextId),
    query,
    page: Number(url.searchParams.get("currentPage")),
    pageSize,
    categories: [
      ...new Set(products.flatMap((p) => p.main_category?.code ?? [])),
    ],
  });
  if (!result) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(JSON.stringify(rewriteSearch(search, result, pageSize)), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const nativeFetch = window.fetch;

window.fetch = async (input, init) => {
  const response = await nativeFetch(input, init);
  const url = new URL(
    input instanceof Request ? input.url : String(input),
    location.href,
  );
  if (!url.pathname.endsWith(SEARCH_PATH)) return response;
  try {
    return await sorted(response, url);
  } catch {
    return response;
  }
};
