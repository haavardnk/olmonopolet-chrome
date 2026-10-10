import { defineManifest } from "@crxjs/vite-plugin";
import { loadEnv } from "vite";

const DEV_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArlBWrtzi4evkyDj0dOc8VIsTJTwu1zZpoHfpyQYNwQjV9bzw3m7i/gX2iheYvf1DZNAxYkQ9YDh9nMUM8brTJFQbVR2bqlqCnu4W4MUf0cnQ+9r0AQihsfRuBYLR0g98Jtor8Kev/Qtk9qYosfYPaNH4tXwIwZFKr/OH2ycsC2nUPhLACoe7JkUquXBgVmMb5JZyVdUJfjUC3Zk6OIJFl3e4XJJNwoYIRCVeThdLo5QBx5Q9eiekpnf9tLq5qJC5MtVKvQ48tIB1WNkDPWmwdPMYLXqMjSIqpXPEgs9mML7M02gZr70PK/eJVQsNtaZQ3cEOnoSwYS82VbTdn+kb5wIDAQAB";

const PROD_API = "https://api.olmonopolet.app";

export default defineManifest((env) => {
  const apiBaseUrl =
    loadEnv(env.mode, process.cwd(), "VITE_").VITE_API_BASE_URL || PROD_API;
  const devBuild = env.command === "serve" || apiBaseUrl !== PROD_API;
  return {
    manifest_version: 3,
    name: "Ølmonopolet",
    version: "0.4.1",
    description: "Vurderinger og ølfakta fra Ølmonopolet på Vinmonopolet.no",
    ...(devBuild ? { key: DEV_KEY } : {}),
    icons: {
      "16": "assets/img/icon16.png",
      "48": "assets/img/icon48.png",
      "128": "assets/img/icon128.png",
    },
    permissions: ["storage"],
    host_permissions: [`${apiBaseUrl}/*`],
    action: {
      default_popup: "src/popup/popup.html",
    },
    background: {
      service_worker: "src/background/index.ts",
      type: "module",
    },
    externally_connectable: {
      matches: ["https://olmonopolet.app/*"],
    },
    web_accessible_resources: [
      {
        resources: ["fonts/*.woff2"],
        matches: ["https://*.vinmonopolet.no/*"],
      },
    ],
    content_scripts: [
      {
        matches: ["https://*.vinmonopolet.no/*"],
        js: ["src/content/main/index.ts"],
        run_at: "document_start",
        world: "MAIN",
      },
      {
        matches: ["https://*.vinmonopolet.no/*"],
        js: ["src/content/index.ts"],
        run_at: "document_end",
      },
    ],
  };
});
