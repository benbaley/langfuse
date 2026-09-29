import React from "react";
import { useRouter } from "next/router";
import SessionsTable from "@/src/features/sessions/SessionsTable";
import Page from "@/src/components/layouts/page";
import { SessionsOnboarding } from "@/src/components/onboarding/SessionsOnboarding";
import { api } from "@/src/utils/api";
import { useReadPath } from "@/src/features/events";
import { Trans, useTranslation } from "react-i18next";

export default function SessionsPage() {
  const { t: tFeatures } = useTranslation("features");
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const { isV4 } = useReadPath();

  const { data: hasAnySession, isLoading } = api.sessions.hasAny.useQuery(
    { projectId },
    {
      enabled: !!projectId && !isV4,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchInterval: 10_000,
    },
  );

  const { data: hasAnySessionFromEvents, isLoading: isLoadingFromEvents } =
    api.sessions.hasAnyFromEvents.useQuery(
      { projectId },
      {
        enabled: !!projectId && isV4,
        trpc: {
          context: {
            skipBatch: true,
          },
        },
        refetchInterval: 10_000,
      },
    );

  const hasSessions = isV4 ? hasAnySessionFromEvents : hasAnySession;
  const isLoadingSessions = isV4 ? isLoadingFromEvents : isLoading;
  const showOnboarding = !isLoadingSessions && !hasSessions;

  return (
    <Page
      headerProps={{
        title: tFeatures("ui.sessions"),
        help: {
          description: (
            <Trans
              t={tFeatures}
              i18nKey="help.sessions"
              components={{
                docs: (
                  <a
                    href="https://langfuse.com/docs/observability/features/sessions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="decoration-primary/30 hover:decoration-primary underline"
                    onClick={(e) => e.stopPropagation()}
                  />
                ),
              }}
            />
          ),
          href: "https://langfuse.com/docs/observability/features/sessions",
        },
      }}
      scrollable={showOnboarding}
    >
      {/* Show onboarding screen if user has no sessions */}
      {showOnboarding ? (
        <SessionsOnboarding />
      ) : (
        <SessionsTable
          projectId={projectId}
          isV4={isV4}
          showControlsInPageHeader
        />
      )}
    </Page>
  );
}
