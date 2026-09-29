import { useTranslation } from "react-i18next";
import {
  captureUnderscoreErrorException,
  isEnabled as isSentryEnabled,
} from "@sentry/nextjs";
import Head from "next/head";
import NextErrorComponent, { type ErrorProps } from "next/error";
import type { NextPageContext } from "next";
import { CrashModal } from "@/src/components/CrashModal/CrashModal";

type LangfuseErrorPageProps = ErrorProps & {
  sentryEventId?: string;
  showReturnHome: boolean;
};

const statusTitles: Record<number, string> = {
  400: "Bad Request",
  404: "This page could not be found",
  405: "Method Not Allowed",
  500: "Internal Server Error",
};

const ErrorPage = ({
  hostname,
  sentryEventId,
  showReturnHome,
  statusCode,
  title,
}: LangfuseErrorPageProps) => {
  const { t } = useTranslation("settingsMore");
  const statusKeys: Record<number, string> = {
    400: "error.badRequest",
    404: "error.notFound",
    405: "error.methodNotAllowed",
    500: "error.internal",
  };
  const resolvedTitle =
    title && title !== statusTitles[statusCode]
      ? title
      : t(statusKeys[statusCode] ?? "error.unexpectedPage");
  const description = statusCode
    ? t("error.statusDescription", { title: resolvedTitle })
    : hostname
      ? t("error.clientHostDescription", { hostname })
      : t("error.clientDescription");
  const documentTitle = statusCode
    ? `${statusCode}: ${resolvedTitle}`
    : t("error.clientTitle");

  return (
    <>
      <Head>
        <title>{documentTitle}</title>
      </Head>
      <div className="min-h-screen-with-banner bg-background text-foreground flex items-center justify-center px-6 py-10">
        <CrashModal
          description={description}
          sentryEventId={sentryEventId}
          showReturnHome={showReturnHome}
          statusCode={statusCode}
        />
      </div>
    </>
  );
};

ErrorPage.skipAppLayout = true;

ErrorPage.getInitialProps = async (
  context: NextPageContext,
): Promise<LangfuseErrorPageProps> => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(context);
  const sentryEventId = isSentryEnabled()
    ? await captureUnderscoreErrorException(context)
    : undefined;
  const pathname = context.asPath?.split(/[?#]/)[0];

  return {
    ...errorInitialProps,
    sentryEventId,
    showReturnHome: pathname !== "/",
  };
};

export default ErrorPage;
