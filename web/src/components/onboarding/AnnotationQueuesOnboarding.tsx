import { useTranslation } from "react-i18next";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ClipboardCheck, Users, BarChart4, GitMerge } from "lucide-react";
import { CreateOrEditAnnotationQueueButton } from "@/src/features/annotation-queues";

export function AnnotationQueuesOnboarding({
  projectId,
}: {
  projectId: string;
}) {
  const { t: tFeatures } = useTranslation("features");

  const valuePropositions: ValueProposition[] = [
    {
      title: tFeatures("evalsMore:onboarding.queuesManage"),
      description: tFeatures("evalsMore:onboarding.queuesManageHelp"),
      icon: ClipboardCheck,
    },
    {
      title: tFeatures("evalsMore:onboarding.queuesCollaborate"),
      description: tFeatures("evalsMore:onboarding.queuesCollaborateHelp"),
      icon: Users,
    },
    {
      title: tFeatures("evalsMore:onboarding.queuesMetrics"),
      description: tFeatures("evalsMore:onboarding.queuesMetricsHelp"),
      icon: BarChart4,
    },
    {
      title: tFeatures("evalsMore:onboarding.queuesBaseline"),
      description: tFeatures("evalsMore:onboarding.queuesBaselineHelp"),
      icon: GitMerge,
    },
  ];

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.queuesTitle")}
      description={tFeatures("evalsMore:onboarding.queuesDescription")}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: tFeatures("evalsMore:onboarding.queuesCreate"),
        component: (
          <CreateOrEditAnnotationQueueButton
            variant="default"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: tFeatures("evalsMore:onboarding.learnMore"),
        href: "https://langfuse.com/docs/scores/annotation",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/annotation-queue-overview-v1.mp4"
    />
  );
}
