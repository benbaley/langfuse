import { useTranslation } from "react-i18next";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ThumbsUp, Star, LineChart, Code } from "lucide-react";

export function ScoresOnboarding() {
  const { t: tFeatures } = useTranslation("features");

  const valuePropositions: ValueProposition[] = [
    {
      title: tFeatures("evalsMore:onboarding.scoresFeedback"),
      description: tFeatures("evalsMore:onboarding.scoresFeedbackHelp"),
      icon: ThumbsUp,
    },
    {
      title: tFeatures("evalsMore:onboarding.scoresModels"),
      description: tFeatures("evalsMore:onboarding.scoresModelsHelp"),
      icon: Star,
    },
    {
      title: tFeatures("evalsMore:onboarding.scoresMetrics"),
      description: tFeatures("evalsMore:onboarding.scoresMetricsHelp"),
      icon: LineChart,
    },
    {
      title: tFeatures("evalsMore:onboarding.scoresCustom"),
      description: tFeatures("evalsMore:onboarding.scoresCustomHelp"),
      icon: Code,
    },
  ];

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.scoresTitle")}
      description={tFeatures("evalsMore:onboarding.scoresDescription")}
      valuePropositions={valuePropositions}
      secondaryAction={{
        label: tFeatures("evalsMore:onboarding.learnMore"),
        href: "https://langfuse.com/docs/evaluation/evaluation-methods/custom-scores",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/scores-overview-v1.mp4"
    />
  );
}
