import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";

export function SessionsOnboarding() {
  const { t: tFeatures } = useTranslation("features");

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.sessionsTitle")}
      description={tFeatures("evalsMore:onboarding.sessionsDescription")}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/sessions-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">
          {tFeatures("evalsMore:onboarding.sessionIdStart")}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          <Trans
            t={tFeatures}
            i18nKey="evalsMore:onboarding.sessionIdHelp"
            components={{ code: <code /> }}
          />
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/sessions"
          variant="default"
        >
          {tFeatures("evalsMore:onboarding.readDocs")}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
