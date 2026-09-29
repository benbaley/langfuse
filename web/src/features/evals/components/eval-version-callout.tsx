import type { TFunction } from "i18next";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { AlertTriangle } from "lucide-react";
import { type EvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import {
  isTraceTarget,
  isEventTarget,
  isExperimentTarget,
  isDatasetTarget,
} from "@/src/features/evals/utils/typeHelpers";

interface EvalVersionCalloutProps {
  content: CalloutContent;
}

interface CalloutContent {
  title: string;
  description: React.ReactNode;
}

export const getEvalVersionCalloutContent = (
  targetObject: string,
  evalCapabilities: EvalCapabilities,
  tFeatures: TFunction,
) => {
  // For event/observation target
  if (isEventTarget(targetObject)) {
    if (evalCapabilities.isNewCompatible) {
      return null;
    }

    return {
      title: tFeatures("evalsMore:sdk.verify"),
      description: (
        <>
          {tFeatures("evalsMore:sdk.observations")}{" "}
          <a
            href="https://langfuse.com/docs/observability/sdk/upgrade-path"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            {tFeatures("evalsMore:sdk.learnMore")}
          </a>
          .
        </>
      ),
    };
  }

  // For experiment target (Experiment Runner SDK)
  if (isExperimentTarget(targetObject)) {
    if (!evalCapabilities.isNewCompatible) {
      return {
        title: tFeatures("evalsMore:sdk.verifyRunner"),
        description: (
          <>
            {tFeatures("evalsMore:sdk.runner")}{" "}
            <a
              href="https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#experiment-runner-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-blue font-bold hover:opacity-80"
            >
              {tFeatures("evalsMore:sdk.learnRunner")}
            </a>
            .
          </>
        ),
      };
    }

    return null;
  }

  // For dataset target (legacy dataset run methods)
  if (isDatasetTarget(targetObject)) {
    // Forced-v3 projects keep trace evaluators as their intended experience —
    // no upgrade nag.
    if (evalCapabilities.forceV3Experience) {
      return null;
    }

    return {
      title: tFeatures("evalsMore:sdk.legacyMethods"),
      description: (
        <>
          {tFeatures("evalsMore:sdk.legacyRuns")}{" "}
          <a
            href="https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#experiment-runner-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            {tFeatures("evalsMore:sdk.learnMore")}
          </a>
          .
        </>
      ),
    };
  }

  // For trace target
  if (isTraceTarget(targetObject)) {
    // Forced-v3 projects keep trace evaluators as their intended experience —
    // no upgrade nag.
    if (evalCapabilities.forceV3Experience) {
      return null;
    }

    return {
      title: tFeatures("evalsMore:sdk.upgradeTitle"),
      description: (
        <>
          {tFeatures("evalsMore:sdk.recommendObservations")}{" "}
          <a
            href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            {tFeatures("evalsMore:sdk.learnMore")}
          </a>
          .
        </>
      ),
    };
  }

  return null;
};

export function EvalVersionCallout({ content }: EvalVersionCalloutProps) {
  return (
    <div className="mt-2 w-full max-w-4xl">
      <Alert variant="warning" icon={AlertTriangle}>
        <Alert.Description>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-foreground font-bold">{content.title}</span>
              <span className="text-foreground text-sm">
                {content.description}
              </span>
            </div>
          </div>
        </Alert.Description>
      </Alert>
    </div>
  );
}
