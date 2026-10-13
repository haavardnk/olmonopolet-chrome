import { describe, it, expect, beforeEach, vi } from "vitest";
import { normalizeMatchUrl } from "../../src/content/api/wrongMatch";
import { renderPanel } from "../../src/content/ui/panel";
import type { Beer } from "../../src/shared/types";

function openFrom(beer: Partial<Beer>): HTMLDialogElement {
  const panel = renderPanel({ vmp_id: 42, ...beer } as Beer, "42");
  document.body.appendChild(panel);
  panel.querySelector<HTMLButtonElement>(".olmono-panel-report")!.click();
  return document.querySelector<HTMLDialogElement>(".olmono-dialog")!;
}

function submit(dialog: HTMLDialogElement, value: string): void {
  dialog.querySelector<HTMLInputElement>(".olmono-dialog-input")!.value = value;
  dialog.querySelector("form")!.requestSubmit();
}

beforeEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("normalizeMatchUrl", () => {
  it.each<[string, string | null]>([
    [
      " https://untappd.com/b/nogne-o-porter/27638 ",
      "https://untappd.com/b/nogne-o-porter/27638",
    ],
    [
      "https://www.untappd.com/b/nogne-o-porter/27638/?ref=x",
      "https://untappd.com/b/nogne-o-porter/27638",
    ],
    ["https://untp.beer/s/c12345", "https://untp.beer/s/c12345"],
    ["http://untappd.com/b/nogne-o-porter/27638", null],
    ["https://untappd.com/b/nogne-o-porter", null],
    ["https://untappd.com/brewery/1234", null],
    ["https://example.com/b/nogne-o-porter/27638", null],
    ["not a url", null],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeMatchUrl(input)).toBe(expected);
  });
});

describe("match report", () => {
  it.each<[string, Partial<Beer>, string]>([
    ["rated", { rating: 3.6 }, "Feil øl?"],
    ["unrated", { rating: null }, "Foreslå match"],
  ])("labels the footer action for %s beers", (_, beer, label) => {
    const dialog = openFrom(beer);

    expect(document.querySelector(".olmono-panel-report")?.textContent).toBe(
      label,
    );
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector("h2")?.textContent).toBe(label);
  });

  it("rejects an invalid link without sending", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const dialog = openFrom({ rating: 3.6 });

    submit(dialog, "https://example.com/beer/1");

    expect(
      dialog.querySelector(".olmono-dialog-error")?.hasAttribute("hidden"),
    ).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each<[string, number, string]>([
    [
      "thanks the user when accepted",
      201,
      "Takk! Forslaget ditt blir vurdert.",
    ],
    ["shows an error when rejected", 400, "Kunne ikke sende forslaget."],
  ])("%s", async (_, status, message) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: status < 300, status });
    vi.stubGlobal("fetch", fetchMock);
    const dialog = openFrom({ rating: 3.6 });

    submit(dialog, "https://untappd.com/b/nogne-o-porter/27638/");

    await vi.waitFor(() => expect(dialog.textContent).toContain(message));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/wrongmatch\/$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      beer: "42",
      suggested_url: "https://untappd.com/b/nogne-o-porter/27638",
    });
  });
});
