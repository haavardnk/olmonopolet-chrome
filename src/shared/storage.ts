export function localArea(): chrome.storage.LocalStorageArea | null {
  if (typeof chrome === "undefined") return null;
  return chrome.storage?.local ?? null;
}

export function onLocalChange(
  key: string,
  callback: (value: unknown) => void,
): () => void {
  if (typeof chrome === "undefined" || !chrome.storage?.onChanged)
    return () => {};
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ): void => {
    if (area !== "local" || !changes[key]) return;
    callback(changes[key].newValue);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
