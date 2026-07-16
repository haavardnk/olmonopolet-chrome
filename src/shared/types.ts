export interface Badge {
  text: string;
}

export interface UserCheckin {
  rating: number;
}

export interface Beer {
  vmp_id: number;
  rating: number | null;
  untpd_url?: string;
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
}

export interface BeerListResponse {
  results?: Beer[];
}

export interface UserList {
  id: number;
  name: string;
  list_type: string;
  product_ids: string[];
}

export type PageType = "search" | "details" | "cart" | "wishlist" | "unknown";
