import { describe, it, expect, beforeEach } from "vitest";
import { notifySessionExpired } from "../../src/content/core/notice";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("notifySessionExpired", () => {
  it("shows a reconnect toast with a login link", () => {
    notifySessionExpired();
    const toast = document.querySelector(".olmono-toast");
    expect(toast).not.toBeNull();
    expect(toast?.querySelector("a")?.getAttribute("href")).toContain(
      "olmonopolet.app/login",
    );
  });

  it("does not stack multiple toasts", () => {
    notifySessionExpired();
    notifySessionExpired();
    expect(document.querySelectorAll(".olmono-toast")).toHaveLength(1);
  });

  it("dismisses when the close button is clicked", () => {
    notifySessionExpired();
    document.querySelector<HTMLButtonElement>(".olmono-toast-close")?.click();
    expect(document.querySelector(".olmono-toast")).toBeNull();
  });
});
