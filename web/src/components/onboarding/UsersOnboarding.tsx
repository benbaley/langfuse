import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { ActionButton } from "@/src/components/ActionButton";

export function UsersOnboarding() {
  const { t: tFeatures } = useTranslation("features");

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.usersTitle")}
      description={tFeatures("evalsMore:onboarding.usersDescription")}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/users-overview-v1.mp4"
    >
      <div className="mt-8">
        <h3 className="mb-4 text-2xl font-bold">
          {tFeatures("evalsMore:onboarding.userIdStart")}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          <Trans
            t={tFeatures}
            i18nKey="evalsMore:onboarding.userIdHelp"
            components={{ code: <code /> }}
          />
        </p>
        <ActionButton
          href="https://langfuse.com/docs/observability/features/users"
          variant="default"
        >
          {tFeatures("evalsMore:onboarding.readDocs")}
        </ActionButton>
      </div>
    </SplashScreen>
  );
}
