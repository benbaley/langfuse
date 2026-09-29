import type { TFunction } from "i18next";
export const DASHBOARD_TABS = {
  DASHBOARDS: "dashboards",
  WIDGETS: "widgets",
} as const;

export const getDashboardTabs = (
  projectId: string,
  t: TFunction<"navigation">,
) => [
  {
    value: DASHBOARD_TABS.DASHBOARDS,
    label: t("dashboard.dashboards"),
    href: `/project/${projectId}/dashboards`,
  },
  {
    value: DASHBOARD_TABS.WIDGETS,
    label: t("dashboard.widgets"),
    href: `/project/${projectId}/widgets`,
  },
];
