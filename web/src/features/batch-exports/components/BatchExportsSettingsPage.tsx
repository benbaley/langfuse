import { useTranslation } from "react-i18next";
import Header from "@/src/components/layouts/header";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { BatchExportsTable } from "@/src/features/batch-exports/components/BatchExportsTable";
import { useHasProjectAccess } from "@/src/features/rbac";
import { SettingsTableCard } from "@/src/components/layouts/settings-table-card";

export function BatchExportsSettingsPage(props: { projectId: string }) {
  const { t } = useTranslation("settingsMore");
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "batchExports:read",
  });

  return (
    <>
      <Header title={t("batch.exports")} />
      <p className="mb-4 text-sm">{t("batch.exportsHint")}</p>
      {hasAccess ? (
        <SettingsTableCard>
          <BatchExportsTable projectId={props.projectId} />
        </SettingsTableCard>
      ) : (
        <Alert>
          <Alert.Title>{t("common.accessDenied")}</Alert.Title>
          <Alert.Description>{t("batch.exportsDenied")}</Alert.Description>
        </Alert>
      )}
    </>
  );
}
