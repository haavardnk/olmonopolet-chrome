import type { Beer } from "../../shared/types";

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
