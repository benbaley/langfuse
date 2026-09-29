import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/src/utils/api";
import Header from "@/src/components/layouts/header";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { useHasProjectAccess } from "@/src/features/rbac";

export function PersonalNotificationSettings() {
  const { t } = useTranslation("settingsMore");
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [isSaving, setIsSaving] = useState(false);

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "project:read",
  });

  const {
    data: preferences,
    isLoading,
    refetch,
  } = api.notificationPreferences.getForProject.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
  );

  const updatePreference = api.notificationPreferences.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    await updatePreference.mutateAsync({
      projectId,
      channel: "EMAIL",
      type: "COMMENT_MENTION",
      enabled,
    });
    setIsSaving(false);
  };

  if (isLoading || !preferences) {
    return (
      <div>
        <Header title={t("notifications.personal")} />
        <p className="text-muted-foreground mt-4 text-sm">
          {t("notifications.loadingPreferences")}
        </p>
      </div>
    );
  }

  const emailCommentMention = preferences.find(
    (p) => p.channel === "EMAIL" && p.type === "COMMENT_MENTION",
  );

  return (
    <div>
      <Header title={t("notifications.personal")} />
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold">{t("notifications.email")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("notifications.personalHint")}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="comment-mention" className="text-base">
              {t("notifications.mentions")}
            </Label>
            <p className="text-muted-foreground text-sm">
              {t("notifications.mentionsHint")}
            </p>
          </div>
          <Switch
            id="comment-mention"
            checked={emailCommentMention?.enabled ?? true}
            onCheckedChange={handleToggle}
            disabled={isSaving || !hasAccess}
          />
        </div>
      </div>

      {updatePreference.isError && (
        <div className="border-destructive bg-destructive/10 mt-4 rounded-lg border p-4">
          <p className="text-destructive text-sm">
            {t("notifications.updateFailed")}
          </p>
        </div>
      )}
    </div>
  );
}
