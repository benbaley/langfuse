import enUiMore from "./locales/en/uiMore.json";
import zhUiMore from "./locales/zh-CN/uiMore.json";
import enSettingsMore from "./locales/en/settingsMore.json";
import zhSettingsMore from "./locales/zh-CN/settingsMore.json";
import enEvalsMore from "./locales/en/evalsMore.json";
import zhEvalsMore from "./locales/zh-CN/evalsMore.json";
import enCoreMore from "./locales/en/coreMore.json";
import zhCoreMore from "./locales/zh-CN/coreMore.json";
import enFilters from "./locales/en/filters.json";
import zhFilters from "./locales/zh-CN/filters.json";
import enApp from "./locales/en/app.json";
import zhApp from "./locales/zh-CN/app.json";
import enAuth from "./locales/en/auth.json";
import zhAuth from "./locales/zh-CN/auth.json";
import enFeatures from "./locales/en/features.json";
import zhFeatures from "./locales/zh-CN/features.json";
import enCore from "./locales/en/core.json";
import zhCore from "./locales/zh-CN/core.json";
import enCommon from "./locales/en/common.json";
import enLanguage from "./locales/en/language.json";
import enNavigation from "./locales/en/navigation.json";
import enSettings from "./locales/en/settings.json";
import zhCommon from "./locales/zh-CN/common.json";
import zhLanguage from "./locales/zh-CN/language.json";
import zhNavigation from "./locales/zh-CN/navigation.json";
import zhSettings from "./locales/zh-CN/settings.json";

export const resources = {
  en: {
    filters: enFilters,
    coreMore: enCoreMore,
    evalsMore: enEvalsMore,
    settingsMore: enSettingsMore,
    uiMore: enUiMore,
    app: enApp,
    auth: enAuth,
    common: enCommon,
    core: enCore,
    features: enFeatures,
    language: enLanguage,
    navigation: enNavigation,
    settings: enSettings,
  },
  "zh-CN": {
    filters: zhFilters,
    coreMore: zhCoreMore,
    evalsMore: zhEvalsMore,
    settingsMore: zhSettingsMore,
    uiMore: zhUiMore,
    app: zhApp,
    auth: zhAuth,
    common: zhCommon,
    core: zhCore,
    features: zhFeatures,
    language: zhLanguage,
    navigation: zhNavigation,
    settings: zhSettings,
  },
} as const;
