type Cleanup = () => void;

function isOwn(node: Node): boolean {
  const el = node instanceof Element ? node : node.parentElement;
  return el?.closest('[class*="olmono"]') != null;
}

function isOwnMutation(record: MutationRecord): boolean {
  const nodes = [...record.addedNodes, ...record.removedNodes];
  return nodes.length > 0 ? nodes.every(isOwn) : isOwn(record.target);
}

export function observeMutations(
  cb: () => void,
  {
    debounce = 200,
    root = document.body,
  }: { debounce?: number; root?: Element } = {},
): Cleanup {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const obs = new MutationObserver((records) => {
    if (records.every(isOwnMutation)) return;
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
