import {
  getSettings,
  setSettings,
  type LabelImageMode,
} from "../shared/settings";

async function init(): Promise<void> {
  const settings = await getSettings();

  const label = document.querySelector<HTMLSelectElement>("#select-label");

  if (label) {
    label.value = settings.labelImage;
    label.addEventListener("change", () => {
      void setSettings({ labelImage: label.value as LabelImageMode });
    });
  }
}

void init();
