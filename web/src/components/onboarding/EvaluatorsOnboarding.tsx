import { useTranslation } from "react-i18next";
import { EvalTemplateSourceCodeLanguage } from "@langfuse/shared";

import { EvaluatorsOnboardingView } from "@/src/components/onboarding/components/EvaluatorsOnboardingView/EvaluatorsOnboardingView";
import type { ActionConfig } from "@/src/components/ui/splash-screen";
import { useIsCodeEvalEnabled } from "@/src/features/evals/hooks/useIsCodeEvalEnabled";

interface EvaluatorsOnboardingProps {
  projectId: string;
  createEvaluatorAction?: ActionConfig;
}

export function EvaluatorsOnboarding({
  projectId,
  createEvaluatorAction,
}: EvaluatorsOnboardingProps) {
  const { t: tFeatures } = useTranslation("features");

  const { enabled, supportedSourceCodeLanguages } = useIsCodeEvalEnabled();
  const codeEvaluatorLanguageDescription =
    supportedSourceCodeLanguages.includes(EvalTemplateSourceCodeLanguage.PYTHON)
      ? tFeatures("evalsMore:onboarding.evalLanguages")
      : "TypeScript";
  const primaryAction = createEvaluatorAction ?? {
    label: tFeatures("evalsMore:onboarding.createEvaluator"),
    href: `/project/${projectId}/evals/new`,
  };

  return (
    <EvaluatorsOnboardingView
      codeEvaluatorLanguageDescription={
        enabled ? codeEvaluatorLanguageDescription : null
      }
      createEvaluatorAction={primaryAction}
    />
  );
}
