import { resolve } from "node:path";
import { defineConfig } from "wxt";
import { extensionVersion } from "./config/version";

const DEV_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArlBWrtzi4evkyDj0dOc8VIsTJTwu1zZpoHfpyQYNwQjV9bzw3m7i/gX2iheYvf1DZNAxYkQ9YDh9nMUM8brTJFQbVR2bqlqCnu4W4MUf0cnQ+9r0AQihsfRuBYLR0g98Jtor8Kev/Qtk9qYosfYPaNH4tXwIwZFKr/OH2ycsC2nUPhLACoe7JkUquXBgVmMb5JZyVdUJfjUC3Zk6OIJFl3e4XJJNwoYIRCVeThdLo5QBx5Q9eiekpnf9tLq5qJC5MtVKvQ48tIB1WNkDPWmwdPMYLXqMjSIqpXPEgs9mML7M02gZr70PK/eJVQsNtaZQ3cEOnoSwYS82VbTdn+kb5wIDAQAB";

const PROD_API = "https://api.olmonopolet.app";

const ICON_SIZES = [16, 48, 128];

export default defineConfig({
  srcDir: "src",
  imports: false,
  webExt: { disabled: true },
  vite: () => ({ build: { target: "es2022" } }),
  zip: { artifactTemplate: "olmonopolet-chrome-{{version}}.zip" },
  hooks: {
    "build:publicAssets": (_wxt, files) => {
      files.push(
        ...ICON_SIZES.map((size) => ({
          absoluteSrc: resolve(`assets/img/icon${size}.png`),
          relativeDest: `icon/${size}.png`,
        })),
      );
    },
  },
  manifest: ({ command }) => {
    const apiBaseUrl = process.env.VITE_API_BASE_URL || PROD_API;
    const devBuild = command === "serve" || apiBaseUrl !== PROD_API;
    return {
      name: "Ølmonopolet",
      version: extensionVersion(),
      description: "Vurderinger og ølfakta fra Ølmonopolet på Vinmonopolet.no",
      ...(devBuild ? { key: DEV_KEY } : {}),
      icons: Object.fromEntries(
        ICON_SIZES.map((size) => [size, `icon/${size}.png`]),
      ),
      permissions: ["storage"],
      host_permissions: [`${apiBaseUrl}/*`],
      externally_connectable: {
        matches: ["https://olmonopolet.app/*"],
      },
      web_accessible_resources: [
        {
          resources: ["fonts/*.woff2"],
          matches: ["https://*.vinmonopolet.no/*"],
        },
      ],
    };
  },
});
