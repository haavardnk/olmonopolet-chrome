export interface Scheduler {
  schedule: () => void;
  restart: () => void;
}

export function createScheduler(
  task: (signal: AbortSignal) => Promise<void>,
): Scheduler {
  let controller = new AbortController();
  let running = false;
  let dirty = false;

  async function drain(): Promise<void> {
    running = true;
    try {
      do {
        dirty = false;
        try {
          await task(controller.signal);
        } catch (err) {
          if (!controller.signal.aborted) console.error("[olmono]", err);
        }
      } while (dirty);
    } finally {
      running = false;
    }
  }

  function schedule(): void {
    if (running) {
      dirty = true;
      return;
    }
    void drain();
  }

  function restart(): void {
    controller.abort();
    controller = new AbortController();
    schedule();
  }

  return { schedule, restart };
}
