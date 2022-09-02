import { Plugin } from "vite";

interface Source {
  resolve: () => void;
  reject: (err: any) => void;
  promise: Promise<void>;
}

function newSource(): Source {
  let resolve;
  let reject;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    // @ts-expect-error
    reject,
    // @ts-expect-error
    resolve,
  };
}

/**
 * When watching for changes, the web-runner would start up immediately after finishing the first
 * build, but it needs to wait for all the child script builds as well. So this util helps wait for
 * those other builds before continuing in the parent build
 */
export class HookWaiter {
  private sources: Source[] = [];
  private hook: keyof Plugin = "name";

  constructor(hook: keyof Plugin) {
    this.hook = hook;
  }

  plugin(): Plugin {
    const index = this.sources.push(newSource()) - 1;
    return new Proxy<Plugin>(
      {
        name: "vite-web-extension-hook-waiter",
        watchChange: () => {
          this.sources[index] = newSource();
        },
      },
      {
        get: (target, field) => {
          if (typeof field === "symbol") return;
          if (target[field as keyof Plugin] != null)
            return target[field as keyof Plugin];
          // Custom hook behavior
          if (field == this.hook) {
            this.sources[index].resolve();
          }
          return undefined;
        },
      }
    );
  }

  waitForAll() {
    return Promise.all(this.sources.map(({ promise }) => promise));
  }
}
