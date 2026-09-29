import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector, UiLanguageProvider } from "./provider";
import { createUiI18n } from "./instance";
import { languageCookieName, readLanguageCookie } from "./config";
import { getDashboardTabs } from "../navigation/utils/dashboard-tabs";
import { getDatasetItemTabs } from "../navigation/utils/dataset-item-tabs";
import { getDatasetRunCompareTabs } from "../navigation/utils/dataset-run-compare-tabs";
import { getDatasetTabs } from "../navigation/utils/dataset-tabs";
import { getEvalsTabs } from "../navigation/utils/evals-tabs";
import { getEvalsV2Tabs } from "../navigation/utils/evals-v2-tabs";
import { getPromptTabs } from "../navigation/utils/prompt-tabs";
import { getScoresTabs } from "../navigation/utils/scores-tabs";
import { getTracingTabs } from "../navigation/utils/tracing-tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "../auth/lib/signupSchema";
import {
  localizeAuthMessage,
  localizeAuthResolver,
} from "../auth/lib/localizeAuthResolver";

function Draft() {
  const [value, setValue] = useState("User supplied English prompt");
  const { t } = useTranslation("settings");
  return (
    <>
      <LanguageSelector />
      <input
        aria-label="Draft"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <span>{t("save")}</span>
    </>
  );
}

afterEach(() => {
  cleanup();
  document.cookie = `${languageCookieName}=; Max-Age=0; Path=/`;
  delete document.documentElement.dataset.uiLocale;
  vi.unstubAllEnvs();
});

describe("UI language", () => {
  it("keeps signup validation and name normalization intact across locales", async () => {
    const english = createUiI18n("en");
    const chinese = createUiI18n("zh-CN");
    const resolver = localizeAuthResolver(zodResolver(signupSchema));
    const options = { fields: {}, shouldUseNativeValidation: false };
    const invalid = await resolver(
      { name: "", email: "invalid", password: "weak" },
      undefined,
      options,
    );
    expect(invalid.values).toEqual({});
    const emailError =
      "email" in invalid.errors ? invalid.errors.email?.message : undefined;
    expect(
      localizeAuthMessage(chinese.getFixedT(null, "auth"), emailError),
    ).toBe("邮箱地址无效");
    expect(
      localizeAuthMessage(english.getFixedT(null, "auth"), emailError),
    ).toBe("Invalid email address");
    const input = {
      name: "Jose\u0301 O’Neil",
      email: "user@example.com",
      password: "Secure1!",
    };
    const valid = await resolver(input, undefined, options);
    expect(valid.errors).toEqual({});
    expect(valid.values).toEqual({ ...input, name: "José O'Neil" });
    expect(input.name).toBe("Jose\u0301 O’Neil");
    expect(
      signupSchema.safeParse({ ...input, email: "invalid" }).error?.issues[0]
        .message,
    ).toBe("Invalid email address");
  });

  it("translates navigation tabs without changing route or selection identities", async () => {
    const instance = createUiI18n("en");
    instance.options.saveMissing = true;
    const missingKey = vi.fn();
    instance.on("missingKey", missingKey);
    const tabs = () => {
      const t = instance.getFixedT(null, "navigation");
      return [
        ...getDashboardTabs("project", t),
        ...getDatasetItemTabs({
          projectId: "project",
          datasetId: "dataset",
          itemId: "item",
          t,
        }),
        ...getDatasetRunCompareTabs("project", "dataset", t),
        ...getDatasetTabs("project", "dataset", t),
        ...getEvalsTabs("project", t),
        ...getEvalsV2Tabs("project", t),
        ...getPromptTabs("project", "prompt/name", t),
        ...getScoresTabs("project", t),
        ...getTracingTabs("project", t),
      ];
    };
    const english = tabs();
    await instance.changeLanguage("zh-CN");
    const chinese = tabs();
    expect(missingKey).not.toHaveBeenCalled();
    expect(chinese.map(({ value, href }) => ({ value, href }))).toEqual(
      english.map(({ value, href }) => ({ value, href })),
    );
    expect(
      chinese.every((tab, index) => tab.label !== english[index].label),
    ).toBe(true);
  });

  it("switches and persists labels without remounting or translating an edited draft", async () => {
    vi.stubEnv("NEXT_PUBLIC_LANGFUSE_DEFAULT_LANGUAGE", "en");
    render(
      <UiLanguageProvider>
        <Draft />
      </UiLanguageProvider>,
    );
    const draft = screen.getByRole("textbox", { name: "Draft" });
    fireEvent.change(draft, { target: { value: "Keep this prompt 原样" } });
    fireEvent.click(screen.getByRole("radio", { name: "简体中文" }));
    await screen.findByText("保存");
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
    expect(draft).toHaveValue("Keep this prompt 原样");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(readLanguageCookie(document.cookie, "en")).toBe("zh-CN");
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    await screen.findByText("Save");
    expect(draft).toHaveValue("Keep this prompt 原样");
  });

  it("hydrates the server language before restoring a saved preference", async () => {
    vi.stubEnv("NEXT_PUBLIC_LANGFUSE_DEFAULT_LANGUAGE", "en");
    document.cookie = `${languageCookieName}=zh-CN; Path=/`;
    const content = (
      <UiLanguageProvider>
        <Draft />
      </UiLanguageProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    expect(container.textContent).toContain("Save");
    document.body.append(container);
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, content, { onRecoverableError });
    });
    await waitFor(() => expect(container.textContent).toContain("保存"));
    expect(onRecoverableError).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    container.remove();
  });

  it("isolates concurrent app languages and falls back to English for missing translations", async () => {
    const english = createUiI18n("en");
    const chinese = createUiI18n("zh-CN");
    expect(english.t("save", { ns: "settings" })).toBe("Save");
    expect(chinese.t("save", { ns: "settings" })).toBe("保存");
    english.addResource("en", "settings", "testFallback", "English fallback");
    await english.changeLanguage("zh-CN");
    expect(english.t("testFallback", { ns: "settings" })).toBe(
      "English fallback",
    );
    expect(
      chinese.t("testFallback", { ns: "settings", defaultValue: "isolated" }),
    ).toBe("isolated");
  });

  it("ignores malformed and unsupported cookie values", () => {
    expect(
      readLanguageCookie("other=en; langfuse-ui-language=zh-CN", "en"),
    ).toBe("zh-CN");
    expect(readLanguageCookie("langfuse-ui-language=%E0%A4%A", "en")).toBe(
      "en",
    );
    expect(readLanguageCookie("langfuse-ui-language=fr", "zh-CN")).toBe(
      "zh-CN",
    );
    expect(readLanguageCookie("not-langfuse-ui-language=zh-CN", "en")).toBe(
      "en",
    );
  });
});
