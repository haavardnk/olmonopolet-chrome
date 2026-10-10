import { defineContentScript } from "wxt/utils/define-content-script";
import { hookSearchFetch } from "../content/main/searchHook";

export default defineContentScript({
  matches: ["https://*.vinmonopolet.no/*"],
  runAt: "document_start",
  world: "MAIN",
  main() {
    hookSearchFetch();
  },
});
