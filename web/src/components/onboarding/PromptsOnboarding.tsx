import { useTranslation } from "react-i18next";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { FileText, GitBranch, Zap, BarChart4 } from "lucide-react";

export function PromptsOnboarding({ projectId }: { projectId: string }) {
  const { t: tFeatures } = useTranslation("features");

  const valuePropositions: ValueProposition[] = [
    {
      title: tFeatures("evalsMore:onboarding.promptsDecoupled"),
      description: tFeatures("evalsMore:onboarding.promptsDecoupledHelp"),
      icon: FileText,
    },
    {
      title: tFeatures("evalsMore:onboarding.promptsEdit"),
      description: tFeatures("evalsMore:onboarding.promptsEditHelp"),
      icon: GitBranch,
    },
    {
      title: tFeatures("evalsMore:onboarding.promptsPerformance"),
      description: tFeatures("evalsMore:onboarding.promptsPerformanceHelp"),
      icon: Zap,
    },
    {
      title: tFeatures("evalsMore:onboarding.promptsMetrics"),
      description: tFeatures("evalsMore:onboarding.promptsMetricsHelp"),
      icon: BarChart4,
    },
  ];

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.promptsTitle")}
      description={tFeatures("evalsMore:onboarding.promptsDescription")}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: tFeatures("evalsMore:onboarding.createPrompt"),
        href: `/project/${projectId}/prompts/new`,
      }}
      secondaryAction={{
        label: tFeatures("evalsMore:onboarding.learnMore"),
        href: "https://langfuse.com/docs/prompt-management/get-started",
      }}
    />
  );
}
