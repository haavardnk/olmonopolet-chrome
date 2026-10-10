import { execSync } from "node:child_process";

const VERSION_PART = /^(0|[1-9]\d{0,4})$/;

function latestTag(): string {
  try {
    return execSync("git describe --tags --abbrev=0", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "0.0.0";
  }
}

export function extensionVersion(): string {
  const version = process.env.EXTENSION_VERSION || latestTag();
  const parts = version.split(".");
  if (
    parts.length > 4 ||
    !parts.every((part) => VERSION_PART.test(part) && Number(part) <= 65535)
  ) {
    throw new Error(`Invalid extension version "${version}"`);
  }
  return version;
}
