import { useTranslation } from "react-i18next";
import { useHasProjectAccess } from "@/src/features/rbac";
import Header from "@/src/components/layouts/header";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { ConnectedLLMApiKeySettingsTable } from "./LLMApiKeySettingsTable/ConnectedLLMApiKeySettingsTable";

export function LlmApiKeyList(props: { projectId: string }) {
  const { t } = useTranslation("settings");
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "llmApiKeys:read",
  });
  if (!hasAccess) {
    return (
      <div>
        <Header title={t("llmConnections")} />
        <Alert>
          <Alert.Title>{t("accessDenied")}</Alert.Title>
          <Alert.Description>{t("llmKeysForbidden")}</Alert.Description>
        </Alert>
      </div>
    );
  }

  return (
    <div id="llm-api-keys">
      <Header title={t("llmConnections")} />
      <p className="mb-4 text-sm">
        Connect your LLM services to enable evaluations and playground features.
        Your provider will charge based on usage.
      </p>
      <ConnectedLLMApiKeySettingsTable projectId={props.projectId} />
    </div>
  );
}
