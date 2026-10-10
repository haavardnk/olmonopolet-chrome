import "../styles/content.css";
import { run } from "./app";
import { loadConfig } from "./core/config";
import { resetHealth } from "./core/health";
import { observeMutations, onRouteChange } from "./core/observer";
import { createScheduler } from "./core/scheduler";

const scheduler = createScheduler(run);

void loadConfig()
  .catch(() => {})
  .finally(scheduler.schedule);
observeMutations(scheduler.schedule, { debounce: 300 });
onRouteChange(() => {
  resetHealth();
  scheduler.restart();
});
