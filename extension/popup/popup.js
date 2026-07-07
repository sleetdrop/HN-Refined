import { openFullSettingsPage } from "../shared/extension-navigation.js";
import { notifyActiveTabPreferencesChanged } from "../shared/preference-messages.js";
import { readPreferences, writePreferences } from "../shared/preference-store.js";

const status = document.querySelector("#storage-status");
const themeControls = [...document.querySelectorAll('input[name="theme"]')];
const openStoryLinksInNewTabs = document.querySelector("#openStoryLinksInNewTabs");
const openSettings = document.querySelector("#open-settings");

let current = await readPreferences();

function setStatus(persisted) {
  status.hidden = persisted;
  status.textContent = persisted ? "" : "Settings may not be saved in this browsing environment.";
}

function render(preferences) {
  for (const control of themeControls) {
    control.checked = control.value === preferences.theme;
  }

  openStoryLinksInNewTabs.checked = preferences.openStoryLinksInNewTabs;
}

render(current.preferences);
setStatus(current.persisted);

for (const control of themeControls) {
  control.addEventListener("change", async (event) => {
    const theme = event.currentTarget.value;
    const latest = await readPreferences();
    const nextPreferences = { ...latest.preferences, theme };
    const result = await writePreferences(nextPreferences);

    current = result;
    render(result.preferences);
    setStatus(result.persisted);
    await notifyActiveTabPreferencesChanged(result.preferences);
  });
}

openStoryLinksInNewTabs.addEventListener("change", async () => {
  const latest = await readPreferences();
  const nextPreferences = {
    ...latest.preferences,
    openStoryLinksInNewTabs: openStoryLinksInNewTabs.checked,
  };
  const result = await writePreferences(nextPreferences);

  current = result;
  render(result.preferences);
  setStatus(result.persisted);
  await notifyActiveTabPreferencesChanged(result.preferences);
});

openSettings.addEventListener("click", async () => {
  await openFullSettingsPage();
});
