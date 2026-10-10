import { localArea, onLocalChange } from "./storage";

const TOKEN_KEY = "olmono:token";

export async function getToken(): Promise<string | null> {
  const area = localArea();
  if (!area) return null;
  const data = await area.get(TOKEN_KEY);
  const token = data[TOKEN_KEY];
  return typeof token === "string" ? token : null;
}

export async function setToken(token: string): Promise<void> {
  const area = localArea();
  if (area) await area.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  const area = localArea();
  if (area) await area.remove(TOKEN_KEY);
}

export async function isConnected(): Promise<boolean> {
  return (await getToken()) !== null;
}

export function onTokenChange(
  callback: (token: string | null) => void,
): () => void {
  return onLocalChange(TOKEN_KEY, (value) =>
    callback(typeof value === "string" ? value : null),
  );
}
