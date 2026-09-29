import type { TFunction } from "i18next";
export const TRACING_TABS = {
  TRACES: "traces",
  OBSERVATIONS: "observations",
} as const;

export const getTracingTabs = (projectId: string, t: TFunction<"navigation">) => [
  {
    value: TRACING_TABS.TRACES,
    label: t("tracing.traces"),
    href: `/project/${projectId}/traces`,
  },
  {
    value: TRACING_TABS.OBSERVATIONS,
    label: t("tracing.observations"),
    href: `/project/${projectId}/observations`,
  },
];
