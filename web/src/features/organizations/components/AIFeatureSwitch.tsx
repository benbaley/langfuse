import { useTranslation } from "react-i18next";
import { useHasOrganizationAccess } from "@/src/features/rbac";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { api } from "@/src/utils/api";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import Header from "@/src/components/layouts/header";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import {
  useLangfuseCloudRegion,
  useQueryOrganization,
} from "@/src/features/organizations/hooks";
import { Card } from "@/src/components/ui/card";
import { LockIcon, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AIFeatureSwitch() {
  const { t } = useTranslation("settings");
  const { data: session, update: updateSession } = useSession();
  const utils = api.useUtils();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const aiFeaturesTracingConfigured =
    session?.environment.aiFeaturesTracingConfigured === true;
  const capture = usePostHogClientCapture();
  const organization = useQueryOrganization();
  const aiFeaturesEnabled = organization?.aiFeaturesEnabled;
  const aiTelemetryEnabled = organization?.aiTelemetryEnabled;
  const [isAIFeatureSwitchEnabled, setIsAIFeatureSwitchEnabled] = useState(
    aiFeaturesEnabled ?? false,
  );
  const [isAITelemetrySwitchEnabled, setIsAITelemetrySwitchEnabled] = useState(
    aiTelemetryEnabled ?? true,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:update",
  });

  const updateAIFeatures = api.organizations.update.useMutation({
    onSuccess: async () => {
      await updateSession();
      // Admins resolve org context from this query, not the session
      utils.organizations.byId.invalidate();
      setConfirmOpen(false);
    },
    onError: () => {
      setConfirmOpen(false);
    },
  });

  const updateAITelemetry = api.organizations.update.useMutation({
    onSuccess: async () => {
      await updateSession();
      // Admins resolve org context from this query, not the session
      utils.organizations.byId.invalidate();
    },
    onError: () => {
      setIsAITelemetrySwitchEnabled(aiTelemetryEnabled ?? true);
    },
  });

  useEffect(() => {
    if (aiFeaturesEnabled === undefined || aiTelemetryEnabled === undefined) {
      return;
    }

    if (!confirmOpen && !updateAIFeatures.isPending) {
      setIsAIFeatureSwitchEnabled(aiFeaturesEnabled);
    }

    if (!updateAITelemetry.isPending) {
      setIsAITelemetrySwitchEnabled(aiTelemetryEnabled);
    }
  }, [
    aiFeaturesEnabled,
    aiTelemetryEnabled,
    confirmOpen,
    updateAIFeatures.isPending,
    updateAITelemetry.isPending,
  ]);

  function handleSwitchChange(newValue: boolean) {
    if (!hasAccess) return;
    setIsAIFeatureSwitchEnabled(newValue);
    setConfirmOpen(true);
  }

  function handleTelemetrySwitchChange(newValue: boolean) {
    if (!organization || !hasAccess) return;
    setIsAITelemetrySwitchEnabled(newValue);
    capture("organization_settings:ai_telemetry_toggle");
    updateAITelemetry.mutate({
      orgId: organization.id,
      aiTelemetryEnabled: newValue,
    });
  }

  function handleCancel() {
    setIsAIFeatureSwitchEnabled(organization?.aiFeaturesEnabled ?? false);
    setConfirmOpen(false);
  }

  function handleConfirm() {
    if (!organization || !hasAccess) return;
    capture("organization_settings:ai_features_toggle");
    updateAIFeatures.mutate({
      orgId: organization.id,
      aiFeaturesEnabled: isAIFeatureSwitchEnabled,
    });
  }

  return (
    <div>
      <Header title={t("aiFeatures")} />
      <Card className="mb-4 p-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="font-bold">{t("enableAiFeatures")}</h4>
            {isLangfuseCloud ? (
              <p className="text-sm">
                {t("aiCloudDescription")}{" "}
                <a
                  href="https://langfuse.com/security/ai-features"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {t("aiDocs")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            ) : (
              <p className="text-sm">{t("aiSelfHostedDescription")}</p>
            )}
          </div>
          <div className="relative">
            <Switch
              checked={isAIFeatureSwitchEnabled}
              onCheckedChange={handleSwitchChange}
              disabled={!hasAccess}
            />
            {!hasAccess && (
              <span title={t("noAccess")}>
                <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
              </span>
            )}
          </div>
        </div>
        {isLangfuseCloud &&
          isAIFeatureSwitchEnabled &&
          aiFeaturesTracingConfigured && (
            <div className="mt-4 flex flex-row items-center justify-between border-t pt-4">
              <div className="flex flex-col gap-1">
                <h4 className="font-bold">{t("aiTelemetry")}</h4>
                <p className="text-sm">{t("aiTelemetryDescription")}</p>
              </div>
              <div className="relative">
                <Switch
                  checked={isAITelemetrySwitchEnabled}
                  onCheckedChange={handleTelemetrySwitchChange}
                  disabled={!hasAccess || updateAITelemetry.isPending}
                />
                {!hasAccess && (
                  <span title={t("noAccess")}>
                    <LockIcon className="text-muted absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform" />
                  </span>
                )}
              </div>
            </div>
          )}
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !updateAIFeatures.isPending) {
            handleCancel();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("aiConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <span className="text-sm">
              {t(
                isAIFeatureSwitchEnabled
                  ? "aiEnableConfirmation"
                  : "aiDisableConfirmation",
                {
                  provider: t(
                    isLangfuseCloud
                      ? "aiCloudProvider"
                      : "aiSelfHostedProvider",
                  ),
                },
              )}
              {isLangfuseCloud && (
                <>
                  <br />
                  <br />{" "}
                  <a
                    href="https://langfuse.com/security/ai-features"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    {t("aiLearnMore")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </span>
            <p className="text-muted-foreground mt-3 text-sm">
              {t("proceedConfirmation")}
            </p>
          </DialogBody>
          <DialogFooter>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateAIFeatures.isPending}
                onClick={handleCancel}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                onClick={handleConfirm}
                loading={updateAIFeatures.isPending}
              >
                {t("confirm")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
