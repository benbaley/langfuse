import { useTranslation } from "react-i18next";
import React from "react";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";

export const WebhookSecretRender = ({
  webhookSecret,
}: {
  webhookSecret: string;
}) => {
  const { t } = useTranslation("settingsMore");
  return (
    <>
      <div className="mb-4">
        <div className="font-bold">{t("webhook.secret")}</div>
        <div className="my-2 text-sm">{t("webhook.oneTimeHint")}</div>
        <CodeView content={webhookSecret} defaultCollapsed={false} />
      </div>
    </>
  );
};
