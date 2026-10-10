import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page,
  type Worker,
} from "@playwright/test";
import { resolve } from "node:path";
import {
  HEALTH_KEY,
  type HealthPage,
  type HealthState,
} from "../../src/shared/health";
import type { AnchorName } from "../../src/shared/anchorConfig";

const EXTENSION = resolve(import.meta.dirname, "../../dist");
const BEER_SEARCH =
  "https://www.vinmonopolet.no/search?q=:relevance:mainCategory:%C3%B8l";
const BLOCKED_TITLE = /just a moment|attention required|access denied/i;

let context: BrowserContext;
let worker: Worker;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    locale: "nb-NO",
    viewport: { width: 1400, height: 1000 },
    args: [
      `--disable-extensions-except=${EXTENSION}`,
      `--load-extension=${EXTENSION}`,
    ],
  });
  worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  await worker.evaluate(() =>
    chrome.storage.local.set({ "olmono:settings": { reports: false } }),
  );
});

test.afterAll(async () => {
  await context.close();
});

async function open(url: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  test.skip(
    BLOCKED_TITLE.test(await page.title()),
    "vinmonopolet.no blocked the runner",
  );
  await page
    .getByRole("button", { name: /Godkjenn alle/i })
    .click({ timeout: 5_000 })
    .catch(() => {});
  return page;
}

async function healthMissing(page: HealthPage): Promise<AnchorName[]> {
  let found: AnchorName[] | undefined;
  await expect
    .poll(
      async () => {
        found = await worker.evaluate(
          async ([key, name]) => {
            const data = await chrome.storage.local.get(key);
            return (data[key] as HealthState | undefined)?.[name]?.missing;
          },
          [HEALTH_KEY, page] as const,
        );
        return found !== undefined;
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  return found ?? [];
}

let productUrl: string | null = null;

test("search page shows ratings and the sort toolbar", async () => {
  const page = await open(BEER_SEARCH);

  const rated = page.locator("ul.product-list > li:has(.olmono-row)");
  await expect(rated.first()).toBeVisible({ timeout: 30_000 });
  await expect(rated.first().locator(".olmono-rating-value")).toHaveText(
    /\d,\d\d/,
  );
  await expect(page.locator(".olmono-toolbar select")).toBeVisible();
  expect(await healthMissing("search")).toEqual([]);

  productUrl = await rated
    .first()
    .locator('a[href*="/p/"]')
    .first()
    .evaluate((a: HTMLAnchorElement) => a.href);
});

test("product page shows the olmonopolet panel", async () => {
  test.skip(!productUrl, "no rated product found on search");
  const page = await open(productUrl ?? "");

  await expect(page.locator(".olmono-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".olmono-row").first()).toBeVisible();
  expect(await healthMissing("details")).toEqual([]);
});
