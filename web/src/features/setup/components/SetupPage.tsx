import Header from "@/src/components/layouts/header";
import ContainerPage from "@/src/components/layouts/container-page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { Card } from "@/src/components/ui/card";
import { ConnectedNewOrganizationForm } from "@/src/features/organizations/components/ConnectedNewOrganizationForm";
import { NewProjectForm } from "@/src/features/projects/components/NewProjectForm";
import { useQueryProjectOrOrganization } from "@/src/features/projects";
import { createProjectRoute } from "@/src/features/setup/setupRoutes";
import { cn } from "@/src/utils/tailwind";
import { Check } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

// Manual setup process
// 1. Create Organization: /setup
// 2. Create Project: /organization/:orgId/setup?orgstep=create-project
export function SetupPage() {
  const { t: tApp } = useTranslation("app");
  const { organization } = useQueryProjectOrOrganization();
  const router = useRouter();

  // starts at 1 to align with breadcrumb
  const stepInt = organization ? 2 : 1;

  return (
    <ContainerPage
      headerProps={{
        title: tApp("ui.Setup"),
        help: {
          description: tApp("setup.help"),
        },
        ...(stepInt === 1 && {
          breadcrumb: [
            {
              name: tApp("setup.organizations"),
              href: "/",
            },
          ],
        }),
      }}
    >
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage
              className={cn(
                stepInt !== 1
                  ? "text-muted-foreground"
                  : "text-foreground font-bold",
              )}
            >
              {tApp("ui.1CreateOrganization")}
              {stepInt > 1 && <Check className="ml-1 inline-block h-3 w-3" />}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage
              className={cn(
                stepInt !== 2
                  ? "text-muted-foreground"
                  : "text-foreground font-bold",
              )}
            >
              {tApp("ui.2CreateProject")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Card className="p-3">
        {
          // 1. Create Org
          stepInt === 1 && (
            <div>
              <Header title={tApp("ui.NewOrganization")} />
              <p className="text-muted-foreground mb-4 text-sm">
                {tApp("ui.OrganizationsAreUsedToManageYourProjectsAndTeams")}
              </p>
              <ConnectedNewOrganizationForm
                onSuccess={async (orgId, sessionRefreshed) => {
                  const projectRoute = createProjectRoute(orgId);
                  await router.push(projectRoute);

                  if (!sessionRefreshed) {
                    // The setup page resolves the new organization from the session.
                    router.reload();
                  }
                }}
              />
            </div>
          )
        }
        {
          // 2. Create Project
          stepInt === 2 && organization && (
            <div>
              <Header title={tApp("ui.NewProject")} />
              <p className="text-muted-foreground mb-4 text-sm">
                {tApp(
                  "ui.ProjectsAreUsedToGroupTracesDatasetsEvalsAndPromptsEnvironmentsCanBeSeparatedUsingTheBuiltInEnvironmentFeature",
                )}
              </p>
              <NewProjectForm
                orgId={organization.id}
                onSuccess={(projectId) =>
                  router.push(`/project/${projectId}/traces`)
                }
              />
            </div>
          )
        }
      </Card>
    </ContainerPage>
  );
}
