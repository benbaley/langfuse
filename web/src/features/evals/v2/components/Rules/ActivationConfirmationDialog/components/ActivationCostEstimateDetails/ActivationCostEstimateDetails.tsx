/* eslint-disable no-nested-ternary */
import { Slider } from "@/src/components/ui/slider";
import { InfoTooltip } from "@/src/components/ui/InfoTooltip/InfoTooltip";
import {
  SAMPLING_SLIDER_MIN,
  SAMPLING_SLIDER_STEP,
} from "@/src/features/evals/v2/constants/ruleSampling";
import type { ActivationEstimate } from "@/src/features/evals/v2/fns/requestRuleActivation";
import { compactNumberFormatter } from "@/src/utils/numbers";
import { ActivationCostEstimateView } from "../ActivationCostEstimateView/ActivationCostEstimateView";
import { useTranslation } from "react-i18next";

export function ActivationCostEstimateDetails({
  estimates: baseEstimates,
  unavailableEstimateCount,
  matchingObservations,
  sampling,
  onSamplingChange,
  descriptionAsTooltip = false,
}: {
  estimates: ActivationEstimate[];
  unavailableEstimateCount: number;
  matchingObservations: number;
  sampling: number;
  onSamplingChange?: (sampling: number) => void;
  descriptionAsTooltip?: boolean;
}) {
  const { t: tFeatures } = useTranslation("features");
  const hasNoMatchingObservations = matchingObservations === 0;
  const hasOnlyUnavailableEstimates =
    baseEstimates.length === 0 && unavailableEstimateCount > 0;
  const sampledObservations = Math.round(matchingObservations * sampling);
  const estimates = baseEstimates.map((estimate) => ({
    ...estimate,
    sampling,
    estimatedCostUsd:
      estimate.matchingObservations * sampling * estimate.testRunCostUsd,
  }));
  const description = hasNoMatchingObservations
    ? tFeatures("evalsMore:cost.noMatches")
    : hasOnlyUnavailableEstimates
      ? tFeatures("evalsMore:cost.confirm")
      : tFeatures("evalsMore:cost.matches", {
          total: compactNumberFormatter(matchingObservations, 1),
        });

  return (
    <div className="flex flex-col gap-4">
      {descriptionAsTooltip ? (
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold">
              {tFeatures("ui.costEstimation")}
            </p>
            <InfoTooltip label={tFeatures("ui.aboutCostEstimation")}>
              {description}
            </InfoTooltip>
          </div>
          <p className="text-muted-foreground text-sm">
            {tFeatures(
              "ui.reviewTheExpectedCostBeforeRunningThisEvaluatorAutomatically",
            )}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {estimates.length > 0 ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold">
                {tFeatures("evalsMore:sampling.rate")}
              </p>
              <InfoTooltip label={tFeatures("evalsMore:sampling.about")}>
                {tFeatures("evalsMore:sampling.description")}
              </InfoTooltip>
            </div>
            <Slider
              min={SAMPLING_SLIDER_MIN}
              max={1}
              step={SAMPLING_SLIDER_STEP}
              value={[sampling]}
              showInput
              displayAsPercentage
              disabled={!onSamplingChange}
              onValueChange={(value) =>
                onSamplingChange?.(value[0] ?? sampling)
              }
            />
            <p className="text-muted-foreground text-xs">
              {tFeatures(
                estimates.length === 1
                  ? "evalsMore:cost.sampleSingle"
                  : "evalsMore:cost.sampleEach",
                {
                  sampled: compactNumberFormatter(sampledObservations, 1),
                  total: compactNumberFormatter(matchingObservations, 1),
                },
              )}
            </p>
          </div>

          <ActivationCostEstimateView estimates={estimates} />
        </>
      ) : null}

      {unavailableEstimateCount > 0 && !hasOnlyUnavailableEstimates ? (
        <p className="text-muted-foreground text-sm">
          {tFeatures("evalsMore:cost.unavailable", {
            total: unavailableEstimateCount,
          })}
        </p>
      ) : null}
    </div>
  );
}
