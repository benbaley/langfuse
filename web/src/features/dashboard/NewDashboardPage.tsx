import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { showSuccessToast, showErrorToast } from "@/src/features/notifications";
import { useHasProjectAccess } from "@/src/features/rbac";
import { useTranslation } from "react-i18next";

export default function NewDashboardPage() {
  const { t: tApp } = useTranslation("app");
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };

  // State for new dashboard
  const [dashboardName, setDashboardName] = useState("New Dashboard");
  const [dashboardDescription, setDashboardDescription] = useState("");

  // Check project access
  const hasCUDAccess = useHasProjectAccess({
    projectId,
    scope: "dashboards:CUD",
  });

  // Mutation for creating a new dashboard
  const createDashboard = api.dashboard.createDashboard.useMutation({
    onSuccess: (data) => {
      showSuccessToast({
        title: tApp("ui.DashboardCreated"),
        description: "Your new dashboard has been created successfully",
      });
      // Navigate to the newly created dashboard
      router.push(`/project/${projectId}/dashboards/${data.id}`);
    },
    onError: (error) => {
      showErrorToast("Error creating dashboard", error.message);
    },
  });

  // Handle form submission
  const handleCreateDashboard = () => {
    if (dashboardName.trim()) {
      createDashboard.mutate({
        projectId,
        name: dashboardName,
        description: dashboardDescription,
      });
    } else {
      showErrorToast("Validation error", "Dashboard name is required");
    }
  };

  return (
    <Page
      withPadding
      headerProps={{
        title: tApp("ui.CreateDashboard"),
        help: {
          description: "Create a new dashboard for your project",
        },
        actionButtonsRight: (
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/project/${projectId}/dashboards`)}
            >
              {tApp("ui.cancel")}
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={
                !dashboardName.trim() ||
                createDashboard.isPending ||
                !hasCUDAccess
              }
              loading={createDashboard.isPending}
            >
              {tApp("ui.Create")}
            </Button>
          </>
        ),
      }}
    >
      <div className="mx-auto my-8 max-w-xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="dashboard-name">{tApp("ui.DashboardName")}</Label>
          <Input
            id="dashboard-name"
            value={dashboardName}
            onChange={(e) => {
              setDashboardName(e.target.value);
            }}
            placeholder={tApp("ui.EnterDashboardName")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dashboard-description">
            {tApp("ui.description")}
          </Label>
          <Textarea
            id="dashboard-description"
            value={dashboardDescription}
            onChange={(e) => {
              setDashboardDescription(e.target.value);
            }}
            placeholder={tApp(
              "ui.DescribeThePurposeOfThisDashboardOptionalButVeryHelpful",
            )}
            rows={4}
          />
        </div>

        <div className="text-muted-foreground text-sm">
          <p>
            {tApp(
              "ui.AfterCreatingTheDashboardYouCanAddWidgetsToVisualizeYourData",
            )}
          </p>
        </div>
      </div>
    </Page>
  );
}
