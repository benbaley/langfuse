import type { TFunction } from "i18next";
export const PROMPT_TABS = {
  VERSIONS: "versions",
  METRICS: "metrics",
} as const;

export const getPromptTabs = (projectId: string, promptName: string, t: TFunction<"navigation">) => [
  {
    value: PROMPT_TABS.VERSIONS,
    label: t("prompts.versions"),
    href: `/project/${projectId}/prompts/${encodeURIComponent(promptName)}`,
  },
  {
    value: PROMPT_TABS.METRICS,
    label: t("prompts.metrics"),
    href: `/project/${projectId}/prompts/${encodeURIComponent(promptName)}/metrics`,
  },
];
