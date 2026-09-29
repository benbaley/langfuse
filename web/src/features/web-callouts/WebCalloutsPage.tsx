import { useTranslation } from "react-i18next";
import ContainerPage from "@/src/components/layouts/container-page";
import { WebCalloutSettingsPage } from "@/src/features/web-callouts/components/WebCalloutSettingsPage";
import { RouteParamsPendingFallback } from "@/src/hooks/useReadyRouteParams";
import { useRouter } from "next/router";

export default function WebCalloutsPage() {
  const { t } = useTranslation("settingsMore");
  const router = useRouter();
  const projectId = router.query.projectId as string | undefined;

  if (!projectId) {
    return <RouteParamsPendingFallback />;
  }

  return (
    <ContainerPage
      headerProps={{
        title: t("callout.title"),
        breadcrumb: [
          {
            name: t("common.settings"),
            href: `/project/${projectId}/settings`,
          },
        ],
      }}
    >
      <WebCalloutSettingsPage projectId={projectId} />
    </ContainerPage>
  );
}
