import { DEFAULT_PREFERENCES, normalizePreferences } from "./defaults.js";

const STORAGE_KEY = "hnRefinedPreferences";

function getBrowserApi() {
  return globalThis.browser || globalThis.chrome;
}

export async function readPreferences() {
  const api = getBrowserApi();

  if (!api?.storage?.local) {
    return { preferences: DEFAULT_PREFERENCES, persisted: false };
  }

  try {
    const result = await api.storage.local.get(STORAGE_KEY);
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
    return { preferences: normalized, persisted: false };
  }

  try {
    await api.storage.local.set({ [STORAGE_KEY]: normalized });
    return { preferences: normalized, persisted: true };
  } catch {
    return { preferences: normalized, persisted: false };
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
