import { defineConfig, type Plugin } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest";

const MAIN_WORLD_ENTRY = "src/content/main/index.ts";

function selfContainedMainWorld(): Plugin {
  return {
    name: "olmono:self-contained-main-world",
    apply: "build",
    generateBundle(_options, bundle) {
      const chunk = Object.values(bundle).find(
        (file) =>
          file.type === "chunk" &&
          file.facadeModuleId?.endsWith(MAIN_WORLD_ENTRY),
      );
      if (chunk?.type !== "chunk") {
        this.error(`${MAIN_WORLD_ENTRY} was not bundled`);
      }
      const shared = [...chunk.imports, ...chunk.dynamicImports];
      if (shared.length > 0) {
        this.error(
          `${MAIN_WORLD_ENTRY} imports shared chunks (${shared.join(", ")}); the MAIN world cannot load them`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [crx({ manifest }), selfContainedMainWorld()],
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        popup: "src/popup/popup.html",
      },
    },
  },
});
