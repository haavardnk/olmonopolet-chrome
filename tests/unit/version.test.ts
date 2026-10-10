import { afterEach, describe, expect, it, vi } from "vitest";
import { extensionVersion } from "../../config/version";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("extensionVersion", () => {
  it.each(["0.5.0", "1", "1.2.3.4", "65535.0"])("accepts %s", (version) => {
    vi.stubEnv("EXTENSION_VERSION", version);
    expect(extensionVersion()).toBe(version);
  });

  it.each(["1.0-beta", "v0.5.0", "01.0", "1.2.3.4.5", "65536", "1..2"])(
    "rejects %s",
    (version) => {
      vi.stubEnv("EXTENSION_VERSION", version);
      expect(() => extensionVersion()).toThrow(version);
    },
  );
});
