import type { TFunction } from "i18next";
export const EVALS_TABS = {
  CONFIGS: "configs",
  TEMPLATES: "templates",
} as const;

export const getEvalsTabs = (projectId: string, t: TFunction<"navigation">) => [
  {
    value: EVALS_TABS.CONFIGS,
    label: t("evals.runningEvaluators"),
    href: `/project/${projectId}/evals/legacy`,
  },
  {
    value: EVALS_TABS.TEMPLATES,
    label: t("evals.evaluatorLibrary"),
    href: `/project/${projectId}/evals/templates`,
  },
];
