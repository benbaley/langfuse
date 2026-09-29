import type { TFunction } from "i18next";
export const EVALS_V2_TABS = {
  EVALUATORS: "evaluators",
  RULES: "rules",
} as const;

export const getEvalsV2Tabs = (projectId: string, t: TFunction<"navigation">) => [
  {
    value: EVALS_V2_TABS.EVALUATORS,
    label: t("evals.evaluators"),
    href: `/project/${projectId}/evals`,
  },
  {
    value: EVALS_V2_TABS.RULES,
    label: t("evals.rules"),
    href: `/project/${projectId}/evals/rules`,
  },
];
