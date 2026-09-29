import { useTranslation } from "react-i18next";
export const CloudPrivacyNotice = ({ action }: { action: string }) => {
  const { t: tApp } = useTranslation("app");
  return (
    <div className="text-muted-foreground mx-auto mt-10 max-w-lg text-center text-xs">
      {tApp("ui.By")} {action} {tApp("ui.YouAreAgreeingToOur")}{" "}
      <a
        href="https://clickhouse.com/legal/clickhouse-general-terms-and-conditions"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {tApp("ui.ClickhouseGeneralTermsAndConditions")}
      </a>
      ,{" "}
      <a
        href="https://clickhouse.com/legal/langfuse-cloud-addendum"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {tApp("ui.LangfuseCloudAddendum")}
      </a>
      {tApp("ui.And")}{" "}
      <a
        href="https://langfuse.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="italic"
      >
        {tApp("ui.LangfusePrivacyPolicy")}
      </a>
      {tApp("ui.YouAlsoConfirmThatTheEnteredDataIsAccurate")}
    </div>
  );
};
