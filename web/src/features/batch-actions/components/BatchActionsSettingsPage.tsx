import { useTranslation } from "react-i18next";
import Header from "@/src/components/layouts/header";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";
import { useHasProjectAccess } from "@/src/features/rbac";
import { BatchActionsTable } from "./BatchActionsTable";

export function BatchActionsSettingsPage(props: { projectId: string }) {
  const { t } = useTranslation("settingsMore");
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });

  return (
    <>
      <Header title={t("batch.actions")} />
      <p className="mb-4 text-sm">{t("batch.actionsHint")}</p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchActionsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <Alert.Title>{t("common.accessDenied")}</Alert.Title>
          <Alert.Description>{t("batch.actionsDenied")}</Alert.Description>
        </Alert>
      )}
    </>
  );
}
