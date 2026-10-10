import {
  READY_ATTR,
  READY_EVENT,
  REPLY_EVENT,
  REQUEST_EVENT,
  type SearchReply,
  type SearchRequest,
  type SearchResult,
} from "../main/protocol";
import { getSettings, setSettings, type SortMode } from "../../shared/settings";
import { isConnected } from "../../shared/auth";
import { searchBeers } from "../api/client";
import { isSearchPath } from "../router";
import { isBeerCategory, isBeerSearch, vmpSort } from "./beerQuery";

export interface AppliedSort {
  sort: SortMode;
  hideTasted: boolean;
  failed: boolean;
  ignored: string[];
}

let applied: AppliedSort | null = null;

export function appliedSort(): AppliedSort | null {
  return applied;
}

async function resolveSearch(
  request: SearchRequest,
): Promise<SearchResult | null> {
  if (
    !isSearchPath() ||
    !isBeerSearch(request.query, request.categories.some(isBeerCategory))
  )
    return null;

  const settings = await getSettings();
  if (settings.sort === "vmp" || vmpSort(request.query) !== "relevance") {
    applied = { sort: "vmp", hideTasted: false, failed: false, ignored: [] };
    if (settings.sort !== "vmp") await setSettings({ sort: "vmp" });
    return null;
  }

  const hideTasted = settings.hideTasted && (await isConnected());
  try {
    const page = await searchBeers({
      query: request.query,
      ordering: settings.sort,
      hideTasted,
      page: request.page + 1,
      pageSize: request.pageSize,
    });
    applied = {
      sort: settings.sort,
      hideTasted,
      failed: false,
      ignored: page.ignored_facets ?? [],
    };
    return { count: page.count, beers: page.results };
  } catch {
    applied = { sort: settings.sort, hideTasted, failed: true, ignored: [] };
    return null;
  }
}

export function listenForSearch(): void {
  document.addEventListener(REQUEST_EVENT, (event) => {
    const request = JSON.parse(
      String((event as CustomEvent<unknown>).detail),
    ) as SearchRequest;
    void resolveSearch(request)
      .catch(() => null)
      .then((result) => {
        const reply: SearchReply = { id: request.id, result };
        document.dispatchEvent(
          new CustomEvent(REPLY_EVENT, { detail: JSON.stringify(reply) }),
        );
      });
  });
  document.documentElement.setAttribute(READY_ATTR, "");
  document.dispatchEvent(new Event(READY_EVENT));
}
