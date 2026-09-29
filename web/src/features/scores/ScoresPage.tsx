import { useRouter } from "next/router";
import ScoresTable from "@/src/features/scores/ScoresTable";
import { TablePeekViewTraceDetail } from "@/src/components/table/peek/peek-trace-detail";
import Page from "@/src/components/layouts/page";
import { api } from "@/src/utils/api";
import { ScoresOnboarding } from "@/src/components/onboarding/ScoresOnboarding";
import { getScoresTabs, SCORES_TABS } from "@/src/features/navigation";
import { useReadPath } from "@/src/features/events";
import {
  useTranslation,
  useTranslation as useNavigationTranslation,
} from "react-i18next";

export default function ScoresPage() {
  const { t: tNavigation } = useNavigationTranslation("navigation");
  const { t: tFeatures } = useTranslation("features");
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const { isV4 } = useReadPath();

  // Check if the user has any scores
  const { data: hasAnyScore, isLoading } = api.scores.hasAny.useQuery(
    { projectId },
    {
      enabled: !!projectId,
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      refetchInterval: 10_000,
    },
  );

  const showOnboarding = !isLoading && !hasAnyScore;

  return (
    <Page
      headerProps={{
        title: tFeatures("ui.scores"),
        help: {
          description: tFeatures("help.scores"),
          href: "https://langfuse.com/docs/evaluation/overview",
        },
        tabsProps: {
          tabs: getScoresTabs(projectId, tNavigation),
          activeTab: SCORES_TABS.SCORES,
        },
      }}
      scrollable={showOnboarding}
    >
      {/* Show onboarding screen if user has no scores */}
      {showOnboarding ? (
        <ScoresOnboarding />
      ) : (
        <ScoresTable
          projectId={projectId}
          showControlsInPageHeader
          showAllEnvironments={router.query.showAllEnvironments === "true"}
          renderTracePeek={({ closePeek, expandPeek }) => (
            <TablePeekViewTraceDetail
              projectId={projectId}
              itemType="TRACE"
              tableName="scores"
              closePeek={closePeek}
              expandPeek={expandPeek}
              isV4={isV4}
            />
          )}
        />
      )}
    </Page>
  );
}
