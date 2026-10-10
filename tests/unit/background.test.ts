import { describe, it, expect, beforeEach } from "vitest";
import { handleExternalMessage } from "../../src/background/externalAuth";
import { getToken, setToken } from "../../src/shared/auth";

const ORIGIN = "https://olmonopolet.app";

beforeEach(async () => {
  await setToken("tok");
});

describe("handleExternalMessage", () => {
  it("rejects messages from other origins", async () => {
    const res = await handleExternalMessage(
      { type: "olmono-auth-token", token: "evil" },
      "https://evil.example",
    );
    expect(res).toEqual({ ok: false });
    expect(await getToken()).toBe("tok");
  });

  it("reports connection status", async () => {
    const res = await handleExternalMessage(
      { type: "olmono-auth-status" },
      ORIGIN,
    );
    expect(res).toEqual({ installed: true, connected: true });
  });

  it("stores a pushed token", async () => {
    const res = await handleExternalMessage(
      { type: "olmono-auth-token", token: "newtok" },
      ORIGIN,
    );
    expect(res).toEqual({ ok: true });
    expect(await getToken()).toBe("newtok");
  });

  it("clears the token on logout", async () => {
    const res = await handleExternalMessage(
      { type: "olmono-auth-logout" },
      ORIGIN,
    );
    expect(res).toEqual({ ok: true });
    expect(await getToken()).toBeNull();
  });
});
