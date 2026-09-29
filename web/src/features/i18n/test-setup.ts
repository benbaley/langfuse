import { initReactI18next } from "react-i18next";
import { beforeEach } from "vitest";
import { createUiI18n } from "./instance";

// Component suites can render standalone components without the app shell.
// The process-wide fallback is test-only; production uses a per-mount provider.
const instance = createUiI18n("en");
instance.use(initReactI18next);
initReactI18next.init(instance);
beforeEach(async () => {
  await instance.changeLanguage("en");
});
