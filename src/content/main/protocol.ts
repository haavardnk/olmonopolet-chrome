import type { Beer } from "../../shared/types";

export const REQUEST_EVENT = "olmono:search-request";
export const REPLY_EVENT = "olmono:search-reply";
export const READY_EVENT = "olmono:bridge-ready";
export const READY_ATTR = "data-olmono-bridge";

export interface SearchRequest {
  id: string;
  query: string;
  page: number;
  pageSize: number;
  categories: string[];
}

export interface SearchResult {
  count: number;
  beers: Beer[];
}

export interface SearchReply {
  id: string;
  result: SearchResult | null;
}
