export const PREFERENCES_CHANGED_MESSAGE_TYPE =
  "hn-refined:preferences-changed";

function browserApi() {
  return globalThis.browser || globalThis.chrome;
}

export function isPreferencesChangedMessage(message) {
  return Boolean(
    message &&
      message.type === PREFERENCES_CHANGED_MESSAGE_TYPE &&
      message.preferences
  );
}

export async function notifyActiveTabPreferencesChanged(preferences) {
  const tabs = browserApi()?.tabs;
  if (!tabs?.query || !tabs?.sendMessage) {
    return false;
  }

  try {
    const [activeTab] = await tabs.query({ active: true, currentWindow: true });
    if (typeof activeTab?.id !== "number") {
      return false;
    }

    await tabs.sendMessage(activeTab.id, {
      type: PREFERENCES_CHANGED_MESSAGE_TYPE,
      preferences
    });
    return true;
  } catch {
    return false;
  }
}
