import { getToken, setToken, clearToken } from "../shared/auth";
import { APP_ORIGIN } from "../shared/constants";

export interface AuthMessage {
  type?: unknown;
  token?: unknown;
}

export async function handleExternalMessage(
  message: AuthMessage,
  origin: string | undefined,
): Promise<Record<string, unknown>> {
  if (origin !== APP_ORIGIN) return { ok: false };

  switch (message.type) {
    case "olmono-auth-status":
      return { installed: true, connected: (await getToken()) !== null };
    case "olmono-auth-token":
      if (typeof message.token === "string" && message.token) {
        await setToken(message.token);
        return { ok: true };
      }
      return { ok: false };
    case "olmono-auth-logout":
      await clearToken();
      return { ok: true };
    default:
      return { ok: false };
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessageExternal) {
  chrome.runtime.onMessageExternal.addListener(
    (message, sender, sendResponse) => {
      void handleExternalMessage(message as AuthMessage, sender.origin).then(
        sendResponse,
      );
      return true;
    },
  );
}
