import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import {
  handleExternalMessage,
  type AuthMessage,
} from "../background/externalAuth";

export default defineBackground(() => {
  browser.runtime.onMessageExternal.addListener(
    (message, sender, sendResponse) => {
      void handleExternalMessage(message as AuthMessage, sender.origin).then(
        sendResponse,
      );
      return true;
    },
  );

  void browser.storage.session
    .setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
    .catch(() => {});
});
