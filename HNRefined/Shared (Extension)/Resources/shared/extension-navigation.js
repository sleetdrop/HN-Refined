function browserApi() {
  return globalThis.browser || globalThis.chrome;
}

function isThenable(value) {
  return value && typeof value.then === "function";
}

function callMaybePromise(fn) {
  const result = fn();
  return isThenable(result) ? result : Promise.resolve(result);
}

export async function openFullSettingsPage() {
  const api = browserApi();

  try {
    if (api?.tabs?.create && api?.runtime?.getURL) {
      await callMaybePromise(() =>
        api.tabs.create({ url: api.runtime.getURL("options/options.html") }),
      );
      return true;
    }

    if (api?.runtime?.openOptionsPage) {
      await callMaybePromise(() => api.runtime.openOptionsPage());
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
