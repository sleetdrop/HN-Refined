export const PREFERENCES_CHANGED_MESSAGE_TYPE =
  "hn-refined:preferences-changed";
const HN_TAB_URL_PATTERN = ["https://", "news.ycombinator.com", "/*"].join("");

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
    const hnTabs = await tabs.query({
      currentWindow: true,
      url: HN_TAB_URL_PATTERN
    });
    const tabIds = hnTabs
      .map((tab) => tab?.id)
      .filter((tabId) => typeof tabId === "number");

    if (tabIds.length === 0) {
      return false;
    }

    await Promise.all(
      tabIds.map((tabId) =>
        tabs.sendMessage(tabId, {
          type: PREFERENCES_CHANGED_MESSAGE_TYPE,
          preferences
        })
      )
    );
    return true;
  } catch {
    return false;
  }
}
