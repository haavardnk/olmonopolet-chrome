import {
  getSettings,
  setSettings,
  type LabelImageMode,
} from "../shared/settings";

async function init(): Promise<void> {
  const settings = await getSettings();

  const valueScore = document.querySelector<HTMLInputElement>(
    "#toggle-value-score",
  );
  const ppau = document.querySelector<HTMLInputElement>("#toggle-ppau");
  const label = document.querySelector<HTMLSelectElement>("#select-label");

  if (valueScore) {
    valueScore.checked = settings.valueScore;
    valueScore.addEventListener("change", () => {
      void setSettings({ valueScore: valueScore.checked });
    });
  }

  if (ppau) {
    ppau.checked = settings.pricePerAlcoholUnit;
    ppau.addEventListener("change", () => {
      void setSettings({ pricePerAlcoholUnit: ppau.checked });
    });
  }

  if (label) {
    label.value = settings.labelImage;
    label.addEventListener("change", () => {
      void setSettings({ labelImage: label.value as LabelImageMode });
    });
  }
}

void init();
