export type UiLanguage = "en" | "zh-CN";

export const languageCookieName = "langfuse-ui-language";

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === "en" || value === "zh-CN";
}

export function readLanguageCookie(
  cookie: string,
  fallback: UiLanguage,
): UiLanguage {
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${languageCookieName}=`))
    ?.slice(languageCookieName.length + 1);
  return isUiLanguage(value) ? value : fallback;
}

// This public setting is embedded in the web build, including Docker builds.
export function getDefaultLanguage(): UiLanguage {
  const configured = process.env.NEXT_PUBLIC_LANGFUSE_DEFAULT_LANGUAGE;
  return isUiLanguage(configured) ? configured : "en";
}

// Runs before the body is painted. Only the two allowlisted values can reach
// the DOM; a saved preference can hide the other language during hydration.
export const languageBootstrapScript = `(()=>{const match=document.cookie.split(';').map(p=>p.trim()).find(p=>p.startsWith('${languageCookieName}='));const value=match?.slice(${languageCookieName.length + 1});if(value==='en'||value==='zh-CN'){document.documentElement.lang=value;document.documentElement.dataset.uiLocale=value;}})();`;
