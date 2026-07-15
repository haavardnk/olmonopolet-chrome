type Cleanup = () => void;

export function waitFor(
  selector: string,
  {
    timeout = 8000,
    root = document.documentElement,
  }: { timeout?: number; root?: Element } = {},
): Promise<Element | null> {
  const existing = document.querySelector(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearTimeout(timer);
        obs.disconnect();
        resolve(el);
      }
    });
    const timer = setTimeout(() => {
      obs.disconnect();
      resolve(null);
    }, timeout);
    obs.observe(root, { childList: true, subtree: true });
  });
}

export function observeMutations(
  cb: () => void,
  {
    debounce = 200,
    root = document.body,
  }: { debounce?: number; root?: Element } = {},
): Cleanup {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const obs = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(cb, debounce);
  });
  obs.observe(root, { childList: true, subtree: true });
  return () => {
    if (timer) clearTimeout(timer);
    obs.disconnect();
  };
}

export function onRouteChange(cb: (url: string) => void): Cleanup {
  let last = location.href;
  const fire = () => {
    if (location.href !== last) {
      last = location.href;
      cb(last);
    }
  };

  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function (
    this: History,
    ...args: Parameters<History["pushState"]>
  ) {
    origPush.apply(this, args);
    fire();
  };
  history.replaceState = function (
    this: History,
    ...args: Parameters<History["replaceState"]>
  ) {
    origReplace.apply(this, args);
    fire();
  };
  window.addEventListener("popstate", fire);
  const poll = setInterval(fire, 1000);

  return () => {
    history.pushState = origPush;
    history.replaceState = origReplace;
    window.removeEventListener("popstate", fire);
    clearInterval(poll);
  };
}

export async function retryUntil(
  fn: () => boolean,
  { attempts = 20, delay = 300 }: { attempts?: number; delay?: number } = {},
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (fn()) return true;
    await new Promise((r) => setTimeout(r, delay));
  }
  return fn();
}
