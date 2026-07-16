export const API_BASE_URL = "https://api.olmonopolet.app";

export const APP_ORIGIN = "https://olmonopolet.app";

export const APP_LOGIN_URL = "https://olmonopolet.app/login";

export const BEER_CATEGORIES = ["ØL", "SIDER", "MJØD"] as const;

export function productUrl(vmpId: number | string): string {
  return `https://olmonopolet.app/products/${vmpId}`;
}
