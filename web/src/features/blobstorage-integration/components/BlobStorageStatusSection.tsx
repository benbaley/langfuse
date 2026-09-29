import { useTranslation } from "react-i18next";
import Header from "@/src/components/layouts/header";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { Card } from "@/src/components/ui/card";
import { BlobStorageExportMode } from "@langfuse/shared";
import { type RouterOutputs } from "@/src/utils/api";

type BlobStorageIntegrationConfig = NonNullable<
  RouterOutputs["blobStorageIntegration"]["get"]["config"]
>;

const EXPORT_MODE_LABELS: Record<BlobStorageExportMode, string> = {
  [BlobStorageExportMode.FULL_HISTORY]: "blob.fullHistory",
  [BlobStorageExportMode.FROM_TODAY]: "blob.fromSetupDate",
  [BlobStorageExportMode.FROM_CUSTOM_DATE]: "blob.fromCustomDate",
};

export const BlobStorageStatusSection = ({
  config,
}: {
  config: BlobStorageIntegrationConfig;
}) => {
  const { t, i18n } = useTranslation("settingsMore");
  return (
    <>
      <Header title={t("common.status")} />
      {config.lastError && (
        <div className="mb-4">
          <Alert variant="destructive">
            <Alert.Title>{t("integrations.lastExportFailed")}</Alert.Title>
            <Alert.Description>
              {config.lastError}
              {config.lastErrorAt && (
                <>
                  <br />
                  <span className="text-xs opacity-70">
                    {new Date(config.lastErrorAt).toLocaleString(i18n.language)}
                  </span>
                </>
              )}
            </Alert.Description>
          </Alert>
        </div>
      )}
      <Card className="p-3">
        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {t("blob.exportedUntil")}
          </span>
          <span>
            {config.lastSyncAt
              ? new Date(config.lastSyncAt).toLocaleString(i18n.language)
              : t("integrations.never")}
          </span>
          {config.nextSyncAt && (
            <>
              <span className="text-muted-foreground">
                {t("blob.nextExport")}
              </span>
              <span>
                {new Date(config.nextSyncAt).toLocaleString(i18n.language)}
              </span>
            </>
          )}
          <span className="text-muted-foreground">{t("blob.exportMode")}</span>
          <span>
            {t(EXPORT_MODE_LABELS[config.exportMode] ?? "common.unknown")}
          </span>
          {(config.exportMode === BlobStorageExportMode.FROM_CUSTOM_DATE ||
            config.exportMode === BlobStorageExportMode.FROM_TODAY) &&
            config.exportStartDate && (
              <>
                <span className="text-muted-foreground">
                  {t("blob.exportStartDate")}
                </span>
                <span>
                  {new Date(config.exportStartDate).toLocaleDateString(
                    i18n.language,
                  )}
                </span>
              </>
            )}
        </div>
      </Card>
    </>
  );
};
