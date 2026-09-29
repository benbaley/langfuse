import { createInstance } from "i18next";
import { resources } from "./resources";
import type { UiLanguage } from "./config";

export function createUiI18n(language: UiLanguage) {
  // Each app mount/request owns its instance. Never change a server singleton's
  // language: concurrent requests may have different preferences.
  const instance = createInstance();
  instance.init({
    resources: structuredClone(resources),
    lng: language,
    fallbackLng: "en",
    supportedLngs: ["en", "zh-CN"],
    load: "currentOnly",
    defaultNS: "common",
    keySeparator: false,
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
