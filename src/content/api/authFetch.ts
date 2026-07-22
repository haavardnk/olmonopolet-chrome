import { getToken, clearToken } from "../../shared/auth";
import { notifySessionExpired } from "../core/notice";

export async function authFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  const apiKey = import.meta.env.VITE_API_KEY;
  const headers = new Headers(init.headers);
  if (apiKey) headers.set("X-Api-Key", apiKey);
  if (token) headers.set("Authorization", `Token ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && token) {
    await clearToken();
    notifySessionExpired();
  }
  return res;
}
