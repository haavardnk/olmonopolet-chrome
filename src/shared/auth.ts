const TOKEN_KEY = "olmono:token";

function localArea(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === "undefined") return null;
  return chrome.storage?.local ?? null;
}

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
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged)
    return () => {};
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ): void => {
    if (area !== "local" || !changes[TOKEN_KEY]) return;
    const value = changes[TOKEN_KEY].newValue;
    callback(typeof value === "string" ? value : null);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
