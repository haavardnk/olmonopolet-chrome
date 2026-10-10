import { describe, it, expect, vi } from "vitest";
import { createScheduler } from "../../src/content/core/scheduler";

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("createScheduler", () => {
  it("coalesces runs requested while a run is in flight", async () => {
    const gates = [deferred(), deferred()];
    let calls = 0;
    const scheduler = createScheduler(async () => {
      await gates[calls++].promise;
    });

    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();
    gates[0].resolve();
    gates[1].resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls).toBe(2);
  });

  it("aborts the running task on restart", async () => {
    const signals: AbortSignal[] = [];
    const gate = deferred();
    const scheduler = createScheduler(async (signal) => {
      signals.push(signal);
      if (signals.length === 1) await gate.promise;
    });

    scheduler.schedule();
    scheduler.restart();
    gate.resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("keeps running after a task throws", async () => {
    let calls = 0;
    const scheduler = createScheduler(async () => {
      calls++;
      throw new Error("boom");
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    scheduler.schedule();
    await new Promise((r) => setTimeout(r, 0));
    scheduler.schedule();
    await new Promise((r) => setTimeout(r, 0));

    expect(calls).toBe(2);
    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });
});
