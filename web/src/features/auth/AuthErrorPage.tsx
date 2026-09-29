import { ErrorPageWithSentry } from "@/src/components/error-page";
import { isExpectedAuthErrorPageMessage } from "@/src/features/auth/lib/expectedAuthErrors";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

export default function AuthErrorPage() {
  const { t: tApp } = useTranslation("app");
  const router = useRouter();
  const { error } = router.query;
  const errorMessage = error
    ? decodeURIComponent(String(error))
    : "An authentication error occurred. Please reach out to support.";

  return (
    <ErrorPageWithSentry
      title={tApp("ui.AuthenticationError")}
      message={errorMessage}
      // Expired magic links and deliberate SSO-domain rejections are expected
      // outcomes (see expectedAuthErrors.ts); unknown values still capture.
      expected={
        error !== undefined && isExpectedAuthErrorPageMessage(errorMessage)
      }
    />
  );
}
