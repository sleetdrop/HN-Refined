import { readPreferences, writePreferences } from "../shared/preference-store.js";

const fields = {
  theme: document.querySelector("#theme"),
  fontPreset: document.querySelector("#fontPreset"),
  desktopDensity: document.querySelector("#desktopDensity"),
  readingWidth: document.querySelector("#readingWidth"),
  mobileLayout: document.querySelector("#mobileLayout"),
  openStoryLinksInNewTabs: document.querySelector("#openStoryLinksInNewTabs")
};

const status = document.querySelector("#storage-status");

function setStatus(persisted) {
  status.hidden = persisted;
  status.textContent = persisted
    ? ""
    : "Settings may not be saved in this browsing environment.";
}

function render(preferences) {
  fields.theme.value = preferences.theme;
  fields.fontPreset.value = preferences.fontPreset;
  fields.desktopDensity.value = preferences.desktopDensity;
  fields.readingWidth.value = preferences.readingWidth;
  fields.mobileLayout.value = preferences.mobileLayout;
  fields.openStoryLinksInNewTabs.checked = preferences.openStoryLinksInNewTabs;
}

function readForm() {
  return {
    theme: fields.theme.value,
    fontPreset: fields.fontPreset.value,
    desktopDensity: fields.desktopDensity.value,
    readingWidth: fields.readingWidth.value,
    mobileLayout: fields.mobileLayout.value,
    openStoryLinksInNewTabs: fields.openStoryLinksInNewTabs.checked
  };
}

const initial = await readPreferences();
render(initial.preferences);
setStatus(initial.persisted);

for (const field of Object.values(fields)) {
  field.addEventListener("change", async () => {
    const result = await writePreferences(readForm());
    render(result.preferences);
    setStatus(result.persisted);
  });
}
