import { Trans, useTranslation } from "react-i18next";
import { Bot, Gauge, Zap, BarChart4 } from "lucide-react";

import {
  type ActionConfig,
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";

export function EvaluatorsOnboardingView({
  codeEvaluatorLanguageDescription,
  createEvaluatorAction,
}: {
  codeEvaluatorLanguageDescription: string | null;
  createEvaluatorAction: ActionConfig;
}) {
  const { t: tFeatures } = useTranslation("features");

  const llmAsJudgeValuePropositions: ValueProposition[] = [
    {
      title: tFeatures("evalsMore:onboarding.evalAutomate"),
      description: tFeatures("evalsMore:onboarding.evalAutomateHelp"),
      icon: Bot,
    },
    {
      title: tFeatures("evalsMore:onboarding.evalQuality"),
      description: tFeatures("evalsMore:onboarding.evalQualityHelp"),
      icon: Gauge,
    },
    {
      title: tFeatures("evalsMore:onboarding.evalScale"),
      description: tFeatures("evalsMore:onboarding.evalScaleHelp"),
      icon: Zap,
    },
    {
      title: tFeatures("evalsMore:onboarding.evalPerformance"),
      description: tFeatures("evalsMore:onboarding.evalPerformanceHelp"),
      icon: BarChart4,
    },
  ];
  if (codeEvaluatorLanguageDescription) {
    return (
      <SplashScreen
        title={tFeatures("evalsMore:onboarding.evalTitle")}
        description={
          <>
            {tFeatures("evalsMore:onboarding.evalIntroduction")}
            <ul className="text-muted-foreground mx-auto mt-2 max-w-2xl list-disc space-y-2 pl-5 text-left text-sm">
              <li>
                <Trans
                  t={tFeatures}
                  i18nKey="evalsMore:onboarding.judgeType"
                  components={{
                    strong: <span className="text-foreground font-bold" />,
                  }}
                />
              </li>
              <li>
                <Trans
                  t={tFeatures}
                  i18nKey="evalsMore:onboarding.codeType"
                  values={{ languages: codeEvaluatorLanguageDescription }}
                  components={{
                    strong: <span className="text-foreground font-bold" />,
                  }}
                />
              </li>
            </ul>
          </>
        }
        primaryAction={createEvaluatorAction}
        secondaryAction={{
          label: tFeatures("evalsMore:onboarding.learnMore"),
          href: "https://langfuse.com/docs/evaluation",
        }}
      />
    );
  }

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.judgeTitle")}
      description={tFeatures("evalsMore:onboarding.judgeDescription")}
      valuePropositions={llmAsJudgeValuePropositions}
      primaryAction={createEvaluatorAction}
      secondaryAction={{
        label: tFeatures("evalsMore:onboarding.learnMore"),
        href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/scores-llm-as-a-judge-overview-v1.mp4"
    />
  );
}
