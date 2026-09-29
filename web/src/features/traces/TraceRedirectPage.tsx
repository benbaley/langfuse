// Redirect helper for /trace/[traceId] URLs
// Looks up the projectId for a trace and redirects to /project/[projectId]/traces/[traceId]
// which displays the current trace view

import { ErrorPage } from "@/src/components/error-page";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const TraceRedirectPage = ({
  notFound,
  duplicatesFound,
}: {
  notFound?: boolean;
  duplicatesFound?: boolean;
}) => {
  const { t: tFeatures } = useTranslation("features");
  const router = useRouter();
  if (router.isFallback) {
    return <div className="p-3">{tFeatures("ui.loading")}</div>;
  }

  if (notFound) {
    return (
      <ErrorPage
        title={tFeatures("ui.traceNotFound")}
        message={tFeatures("errors.traceMissing")}
        additionalButton={{
          label: tFeatures("ui.retry"),
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (duplicatesFound) {
    return (
      <ErrorPage
        title={tFeatures("ui.traceNotFound")}
        message={tFeatures("errors.sdkUpgrade")}
      />
    );
  }

  return <div>{tFeatures("ui.redirecting")}</div>;
};

export default TraceRedirectPage;
