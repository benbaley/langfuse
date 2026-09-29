import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

// This url is deprecated, we keep this redirect page for backward compatibility
export default function EvalConfigsConfigRedirectPage() {
  const { t: tFeatures } = useTranslation("features");
  const router = useRouter();
  if (router.isFallback) {
    return <div className="p-3">{tFeatures("ui.loading")}</div>;
  }

  return <div>{tFeatures("ui.redirecting")}</div>;
}
