import { useEffect, useId, useState, type PropsWithChildren } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Radio } from "@/src/components/design-system/Radio/Radio";
import {
  getDefaultLanguage,
  isUiLanguage,
  languageCookieName,
  readLanguageCookie,
} from "./config";
import { createUiI18n } from "./instance";

function LanguageFrame({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  return (
    <div data-ui-language={i18n.resolvedLanguage} className="contents">
      {children}
    </div>
  );
}

export function UiLanguageProvider({ children }: PropsWithChildren) {
  const [instance] = useState(() => createUiI18n(getDefaultLanguage()));

  // Integrate i18next's external language store with browser preferences and
  // the document language. Server and hydration renders use the build default;
  // the bootstrap visibility rule prevents painting the wrong saved language.
  useEffect(() => {
    const reflectLanguage = (language: string) => {
      if (!isUiLanguage(language)) return;
      document.documentElement.lang = language;
      document.documentElement.dataset.uiLocale = language;
    };
    const syncPreference = () => {
      const language = readLanguageCookie(
        document.cookie,
        getDefaultLanguage(),
      );
      instance.changeLanguage(language);
      reflectLanguage(language);
    };
    const syncOnFocus = () => syncPreference();
    instance.on("languageChanged", reflectLanguage);
    syncPreference();
    window.addEventListener("focus", syncOnFocus);
    return () => {
      instance.off("languageChanged", reflectLanguage);
      window.removeEventListener("focus", syncOnFocus);
    };
  }, [instance]);

  return (
    <I18nextProvider i18n={instance}>
      <LanguageFrame>{children}</LanguageFrame>
    </I18nextProvider>
  );
}

export function LanguageSelector() {
  const { t, i18n } = useTranslation("language");
  const radioName = useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-3 text-sm">
      <legend className="mb-2">{t("label")}</legend>
      {(["zh-CN", "en"] as const).map((language) => (
        <label
          key={language}
          className="flex cursor-pointer items-center gap-2"
        >
          <Radio
            name={radioName}
            checked={i18n.resolvedLanguage === language}
            value={language}
            onChange={() => {
              const secure =
                window.location.protocol === "https:" ? "; Secure" : "";
              document.cookie = `${languageCookieName}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
              i18n.changeLanguage(language);
            }}
          />
          {language === "zh-CN" ? "简体中文" : "English"}
        </label>
      ))}
    </fieldset>
  );
}
