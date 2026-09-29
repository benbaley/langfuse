/* eslint-disable no-nested-ternary */
import { type EvalTemplateType, EvalTemplateTypeEnum } from "@langfuse/shared";
import { InfoTooltip } from "@/src/components/ui/InfoTooltip/InfoTooltip";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Slider } from "@/src/components/ui/slider";
import {
  SAMPLING_SLIDER_MIN,
  SAMPLING_SLIDER_STEP,
} from "@/src/features/evals/v2/constants/ruleSampling";
import { EvaluatorCostCalculationTooltipContent } from "@/src/features/evals/v2/components/EvaluatorCostCalculationTooltipContent/EvaluatorCostCalculationTooltipContent";
import type { ActivationEstimate } from "@/src/features/evals/v2/fns/requestRuleActivation";
import { formatEvaluatorCostCalculation } from "@/src/features/evals/v2/fns/formatEvaluatorCostCalculation";
import { compactNumberFormatter, usdFormatter } from "@/src/utils/numbers";
import { useTranslation } from "react-i18next";

export function EvaluatorSavedCostSummary({
  estimates,
  unavailableEstimateCount,
  matchingObservations,
  sampling,
  isEstimating,
  onSamplingChange,
  evaluatorType,
  backfill,
}: {
  estimates: ActivationEstimate[];
  unavailableEstimateCount: number;
  matchingObservations: number;
  sampling: number;
  isEstimating: boolean;
  onSamplingChange: ((sampling: number) => void) | null;
  evaluatorType: EvalTemplateType;
  backfill:
    | { enabled: false }
    | {
        enabled: true;
        matchingObservations: number;
        maxItems: number;
        testRunCostUsd: number | null;
        isEstimating: boolean;
      };
}) {
  const { t: tFeatures } = useTranslation("features");
  const estimate = estimates[0];
  const sampledObservations = Math.round(matchingObservations * sampling);
  const estimatedCostUsd =
    matchingObservations === 0
      ? 0
      : estimate
        ? estimate.matchingObservations * sampling * estimate.testRunCostUsd
        : null;
  const backfillObservationCount = backfill.enabled
    ? Math.min(backfill.matchingObservations, backfill.maxItems)
    : 0;
  const backfillTestRunCostUsd = backfill.enabled
    ? backfill.testRunCostUsd
    : null;
  const backfillEstimatedCostUsd =
    backfillTestRunCostUsd === null
      ? null
      : backfillObservationCount * sampling * backfillTestRunCostUsd;

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold">{tFeatures("ui.sampling")}</h3>
          {!onSamplingChange ? (
            <InfoTooltip label={tFeatures("ui.samplingIsSetByTheSelectedRule")}>
              {tFeatures(
                "ui.theSamplingRateIsInheritedFromTheSelectedRuleYouCanEditItDirectlyInTheRule",
              )}
            </InfoTooltip>
          ) : null}
        </div>
        <Slider
          min={SAMPLING_SLIDER_MIN}
          max={1}
          step={SAMPLING_SLIDER_STEP}
          value={[sampling]}
          showInput
          displayAsPercentage
          disabled={!onSamplingChange}
          onValueChange={(value) => onSamplingChange?.(value[0] ?? sampling)}
        />
      </section>

      {evaluatorType === EvalTemplateTypeEnum.CODE ? (
        <section>
          <h3 className="text-sm font-bold">{tFeatures("ui.matches")}</h3>
          {isEstimating ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ) : (
            <>
              <p className="mt-1 font-mono text-base font-bold tabular-nums">
                {compactNumberFormatter(matchingObservations, 1)} / week
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {compactNumberFormatter(sampledObservations, 1)} sampled
              </p>
            </>
          )}
        </section>
      ) : null}

      {evaluatorType !== EvalTemplateTypeEnum.CODE ? (
        <section className="border-t pt-4">
          {isEstimating ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-1 font-mono text-[10px] tracking-wider uppercase">
                {tFeatures("ui.recurring")}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-bold tabular-nums">
                  {estimatedCostUsd === null
                    ? tFeatures("ui.unavailable")
                    : `≈ ${usdFormatter(estimatedCostUsd, 2, 2)}`}
                </span>
                <InfoTooltip
                  label={tFeatures("ui.howEstimatedLlmCostsAreCalculated")}
                >
                  <EvaluatorCostCalculationTooltipContent
                    {...formatEvaluatorCostCalculation({
                      matchingObservations,
                      sampling,
                      testRunCostUsd: estimate?.testRunCostUsd ?? null,
                      estimatedCostUsd,
                      evaluatorType,
                    })}
                  />
                </InfoTooltip>
              </div>
              <p className="text-muted-foreground text-xs">
                {tFeatures("ui.estimatedLlmCostsWeek")}
              </p>
              {unavailableEstimateCount > 0 ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {tFeatures(
                    "ui.noRecentCostBearingEvaluatorTraceOrSuccessfulFallbackTestWasAvailable",
                  )}
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {evaluatorType !== EvalTemplateTypeEnum.CODE && backfill.enabled ? (
        <section className="border-t pt-4">
          {backfill.isEstimating ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-1 font-mono text-[10px] tracking-wider uppercase">
                {tFeatures("ui.oneTimeBackfill")}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-bold tabular-nums">
                  {backfillEstimatedCostUsd !== null
                    ? `≈ ${usdFormatter(backfillEstimatedCostUsd, 2, 2)}`
                    : tFeatures("ui.unavailable")}
                </span>
                <InfoTooltip
                  label={tFeatures("ui.howEstimatedBackfillCostsAreCalculated")}
                >
                  <EvaluatorCostCalculationTooltipContent
                    {...formatEvaluatorCostCalculation({
                      matchingObservations: backfillObservationCount,
                      sampling,
                      testRunCostUsd: backfillTestRunCostUsd,
                      estimatedCostUsd: backfillEstimatedCostUsd,
                      evaluatorType,
                      period: "selection",
                    })}
                  />
                </InfoTooltip>
              </div>
              <p className="text-muted-foreground text-xs">
                estimated LLM costs, once
              </p>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
