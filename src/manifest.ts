import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Ølmonopolet",
  version: "0.3.1",
  description: "Legger til Untappd informasjon på Vinmonopolet.no",
  icons: {
    "16": "assets/img/icon16.png",
    "48": "assets/img/icon48.png",
    "128": "assets/img/icon128.png",
  },
  action: {
    default_popup: "src/popup/popup.html",
  },
  content_scripts: [
    {
      matches: ["https://*.vinmonopolet.no/*"],
      js: ["src/content/index.ts"],
      css: ["assets/css/styles.css"],
      run_at: "document_end",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["assets/img/*.svg"],
      matches: ["https://*.vinmonopolet.no/*"],
    },
  ],
});
