export interface Badge {
  text: string;
}

export interface UserCheckin {
  rating: number;
}

export interface Brewery {
  name: string;
  description?: string | null;
}

export interface StyleStats {
  rank: number | null;
  rated: number;
  cheaper_than: number | null;
  priced: number;
}

export interface Release {
  name: string;
  release_date: string | null;
}

export interface Beer {
  vmp_id: number;
  vmp_name?: string;
  vmp_url?: string | null;
  main_category?: string | null;
  sub_category?: string | null;
  country?: string | null;
  price?: number | null;
  volume?: number | null;
  vmp_abv?: number | null;
  product_selection?: string | null;
  post_delivery?: boolean | null;
  store_delivery?: boolean | null;
  rating: number | null;
  untpd_updated?: string;
  checkins?: number;
  ibu?: number | null;
  style?: string | null;
  badges?: Badge[];
  user_checked_in?: UserCheckin[];
  user_tasted?: boolean;
  detail?: string;
  value_score?: number | null;
  price_per_alcohol_unit?: number | null;
  alcohol_units?: number | null;
  label_sm_url?: string | null;
  label_hd_url?: string | null;
  description?: string | null;
  brewery_details?: Brewery | null;
  first_seen?: string | null;
  style_stats?: StyleStats | null;
  releases?: Release[];
}

export interface BeerListResponse {
  results?: Beer[];
}

export interface BeerSearchPage {
  count: number;
  next: string | null;
  results: Beer[];
  ignored_facets?: string[];
}

export interface UserList {
  id: number;
  name: string;
  list_type: string;
  product_ids: string[];
}

export type PageType = "search" | "details" | "cart" | "wishlist" | "unknown";
