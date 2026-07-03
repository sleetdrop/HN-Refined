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

  return lastError instanceof Error
    ? lastError
    : new Error(lastError.message || String(lastError));
}

function getStorageValue(api, key) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (settleWith, value) => {
      if (settled) {
        return;
      }

      settled = true;
      settleWith(value);
    };
    const callback = (result) => {
      const lastError = getLastError(api);

      if (lastError) {
        settle(reject, lastError);
        return;
      }

      settle(resolve, result);
    };

    try {
      const result = api.storage.local.get(key, callback);

      if (isThenable(result)) {
        result.then(
          (value) => settle(resolve, value),
          (error) => settle(reject, error)
        );
      }
    } catch (error) {
      settle(reject, error);
    }
  });
}

function setStorageValue(api, value) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (settleWith, value) => {
      if (settled) {
        return;
      }

      settled = true;
      settleWith(value);
    };
    const callback = () => {
      const lastError = getLastError(api);

      if (lastError) {
        settle(reject, lastError);
        return;
      }

      settle(resolve);
    };

    try {
      const result = api.storage.local.set(value, callback);

      if (isThenable(result)) {
        result.then(
          () => settle(resolve),
          (error) => settle(reject, error)
        );
      }
    } catch (error) {
      settle(reject, error);
    }
  });
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
      persisted: true
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
