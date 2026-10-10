import { storage } from "wxt/utils/storage";

const tokenItem = storage.defineItem<string>("local:olmono:token");

export function getToken(): Promise<string | null> {
  return tokenItem.getValue();
}

export function setToken(token: string): Promise<void> {
  return tokenItem.setValue(token);
}

export function clearToken(): Promise<void> {
  return tokenItem.removeValue();
}

export async function isConnected(): Promise<boolean> {
  return (await getToken()) !== null;
}

export function onTokenChange(
  callback: (token: string | null) => void,
): () => void {
  return tokenItem.watch((token) => callback(token));
}
