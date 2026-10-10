import "../styles/content.css";
import { defineContentScript } from "wxt/utils/define-content-script";
import { run } from "../content/app";
import { loadConfig } from "../content/core/config";
import { resetHealth } from "../content/core/health";
import { observeMutations, onRouteChange } from "../content/core/observer";
import { createScheduler } from "../content/core/scheduler";
import { listenForSearch } from "../content/core/bridge";
import { onSettingsChange } from "../shared/settings";

export default defineContentScript({
  matches: ["https://*.vinmonopolet.no/*"],
  runAt: "document_end",
  noScriptStartedPostMessage: true,
  main() {
    listenForSearch();
    const scheduler = createScheduler(run);

    void loadConfig()
      .catch(() => {})
      .finally(scheduler.schedule);
    observeMutations(scheduler.schedule, { debounce: 300 });
    onRouteChange(() => {
      resetHealth();
      scheduler.restart();
    });
    onSettingsChange(() => scheduler.restart());
  },
});
