import type { TFunction } from "i18next";
export const SCORES_TABS = {
  SCORES: "scores",
  ANALYTICS: "analytics",
} as const;

export const getScoresTabs = (projectId: string, t: TFunction<"navigation">) => [
  {
    value: SCORES_TABS.SCORES,
    label: t("scores.scores"),
    href: `/project/${projectId}/scores`,
  },
  {
    value: SCORES_TABS.ANALYTICS,
    label: t("scores.analytics"),
    href: `/project/${projectId}/scores/analytics`,
  },
];
