import { useRouter } from "next/router";
import Page from "@/src/components/layouts/page";
import { ConnectedDashboardTable } from "@/src/features/dashboard/components/DashboardTable/ConnectedDashboardTable";
import { ActionButton } from "@/src/components/ActionButton";
import { PlusIcon } from "lucide-react";
import { useHasProjectAccess } from "@/src/features/rbac";
import { getDashboardTabs, DASHBOARD_TABS } from "@/src/features/navigation";
import { useTranslation, useTranslation as useNavigationTranslation } from "react-i18next";

export default function DashboardsPage() {
  const { t: tNavigation } = useNavigationTranslation("navigation");
  const { t: tApp } = useTranslation("app");
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });

  return (
    <Page
      headerProps={{
        title: tApp("ui.Dashboards"),
        help: {
          description: "Manage and create dashboards for your project.",
          href: "https://langfuse.com/docs/metrics/features/custom-dashboards",
        },
        tabsProps: {
          tabs: getDashboardTabs(projectId, tNavigation),
          activeTab: DASHBOARD_TABS.DASHBOARDS,
        },
        actionButtonsRight: (
          <ActionButton
            icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
            hasAccess={hasCUDAccess}
            href={`/project/${projectId}/dashboards/new`}
            trackingEventName="dashboard:new_dashboard_form_open"
            variant="default"
          >
            {tApp("ui.NewDashboard")}
          </ActionButton>
        ),
      }}
    >
      <ConnectedDashboardTable />
    </Page>
  );
}
