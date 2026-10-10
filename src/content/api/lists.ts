import { API_BASE_URL } from "../../shared/constants";
import type { UserList } from "../../shared/types";
import { authFetch } from "./authFetch";

let listsCache: UserList[] | null = null;

export async function getLists(force = false): Promise<UserList[]> {
  if (listsCache && !force) return listsCache;
  try {
    const res = await authFetch(`${API_BASE_URL}/lists/`);
    if (!res.ok) return listsCache ?? [];
    const data = (await res.json()) as UserList[] | { results?: UserList[] };
    listsCache = Array.isArray(data) ? data : (data.results ?? []);
    return listsCache;
  } catch {
    return listsCache ?? [];
  }
}

export async function addToList(
  listId: number | string,
  productId: string,
): Promise<boolean> {
  const res = await authFetch(`${API_BASE_URL}/lists/${listId}/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
  return res.ok;
}

export async function removeFromList(
  listId: number | string,
  productId: string,
): Promise<boolean> {
  const res = await authFetch(
    `${API_BASE_URL}/lists/${listId}/products/${productId}/`,
    { method: "DELETE" },
  );
  return res.ok;
}

export function clearListsCache(): void {
  listsCache = null;
}
