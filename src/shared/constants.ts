import { browser } from "wxt/browser";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.olmonopolet.app";

export const APP_ORIGIN = "https://olmonopolet.app";

export const APP_LOGIN_URL = "https://olmonopolet.app/login";

export const BEER_CATEGORIES = ["ØL", "SIDER", "MJØD"] as const;

export const VMP_IMAGE_CACHE = "https://bilder.vinmonopolet.no/cache";

export function productUrl(vmpId: number | string): string {
  return `https://olmonopolet.app/products/${vmpId}`;
}

export function extensionVersion(): string {
  return browser.runtime.getManifest().version;
}
