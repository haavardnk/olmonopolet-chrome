import { API_BASE_URL } from "../../shared/constants";
import { authFetch } from "./authFetch";

const BEER_PATH = /^\/b\/[^/]+\/\d+$/;

export function normalizeMatchUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (url.hostname === "untp.beer" && path.length > 1) {
    return `https://untp.beer${path}`;
  }
  if (!["untappd.com", "www.untappd.com"].includes(url.hostname)) return null;
  if (!BEER_PATH.test(path)) return null;
  return `https://untappd.com${path}`;
}

export async function reportWrongMatch(
  beer: string,
  suggestedUrl: string,
): Promise<boolean> {
  const res = await authFetch(`${API_BASE_URL}/wrongmatch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ beer, suggested_url: suggestedUrl }),
  }).catch(() => null);
  return res?.status === 201;
}
