import { DEFAULT_PREFERENCES, normalizePreferences } from "./defaults.js";

const STORAGE_KEY = "hnRefinedPreferences";

function getBrowserApi() {
  return globalThis.browser || globalThis.chrome;
}

function isThenable(value) {
  return value && typeof value.then === "function";
}

function getLastError(api) {
  const lastError = api?.runtime?.lastError;

  if (!lastError) {
    return null;
  }

  return lastError instanceof Error ? lastError : new Error(lastError.message || String(lastError));
}

function isPromiseStorageApi(api) {
  return api === globalThis.browser;
}

function promiseStorageGet(api, key) {
  const result = api.storage.local.get(key);

  if (!isThenable(result)) {
    return Promise.reject(new Error("storage.local.get did not return a Promise"));
  }

  return result;
}

function promiseStorageSet(api, value) {
  const result = api.storage.local.set(value);

  if (!isThenable(result)) {
    return Promise.reject(new Error("storage.local.set did not return a Promise"));
  }

  return result;
}

function callbackStorageGet(api, key) {
  return new Promise((resolve, reject) => {
    api.storage.local.get(key, (result) => {
      const lastError = getLastError(api);

      if (lastError) {
        reject(lastError);
        return;
      }

      resolve(result);
    });
  });
}

function callbackStorageSet(api, value) {
  return new Promise((resolve, reject) => {
    api.storage.local.set(value, () => {
      const lastError = getLastError(api);

      if (lastError) {
        reject(lastError);
        return;
      }

      resolve();
    });
  });
}

function getStorageValue(api, key) {
  return isPromiseStorageApi(api) ? promiseStorageGet(api, key) : callbackStorageGet(api, key);
}

function setStorageValue(api, value) {
  return isPromiseStorageApi(api) ? promiseStorageSet(api, value) : callbackStorageSet(api, value);
}

export async function readPreferences() {
  const api = getBrowserApi();

  if (!api?.storage?.local) {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }

  try {
    const result = await getStorageValue(api, STORAGE_KEY);
    return {
      preferences: normalizePreferences(result?.[STORAGE_KEY]),
      persisted: true,
    };
  } catch {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }
}

export async function writePreferences(preferences) {
  const api = getBrowserApi();
  const normalized = normalizePreferences(preferences);

  if (!api?.storage?.local) {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }

  try {
    await setStorageValue(api, { [STORAGE_KEY]: normalized });
    return { preferences: normalized, persisted: true };
  } catch {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }
}

export function subscribeToPreferenceChanges(callback) {
  const api = getBrowserApi();
  const listener = (changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    callback(normalizePreferences(changes[STORAGE_KEY].newValue));
  };

  api?.storage?.onChanged?.addListener?.(listener);
  return () => api?.storage?.onChanged?.removeListener?.(listener);
}
