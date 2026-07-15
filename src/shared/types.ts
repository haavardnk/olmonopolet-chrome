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
  detail?: string;
}

export interface BeerListResponse {
  results?: Beer[];
}

export type PageType = "search" | "details" | "cart" | "wishlist" | "unknown";
