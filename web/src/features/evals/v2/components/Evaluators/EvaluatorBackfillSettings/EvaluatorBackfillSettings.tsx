/* eslint-disable no-nested-ternary */
import { format, subMonths } from "date-fns";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { DateRangeInput } from "@/src/features/evals/v2/components/Evaluators/EvaluatorBackfillSettings/components/DateRangeInput/DateRangeInput";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { numberFormatter } from "@/src/utils/numbers";
import { cn } from "@/src/utils/tailwind";
import { Trans, useTranslation } from "react-i18next";

export type EvaluatorBackfillWindow =
  | "24-hours"
  | "7-days"
  | "30-days"
  | "90-days"
  | "custom";

export type EvaluatorBackfillRange = {
  from: Date;
  to: Date;
};

export function EvaluatorBackfillSettings({
  enabled,
  canEnable,
  selectedWindow,
  range,
  maxItems,
  maxAllowedItems,
  matchingObservations,
  isEstimating,
  onEnabledChange,
  onWindowChange,
  onRangeChange,
  onMaxItemsChange,
}: {
  enabled: boolean;
  canEnable: boolean;
  selectedWindow: EvaluatorBackfillWindow;
  range: EvaluatorBackfillRange;
  maxItems: number;
  maxAllowedItems: number;
  matchingObservations: number;
  isEstimating: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onWindowChange: (window: EvaluatorBackfillWindow) => void;
  onRangeChange: (range: EvaluatorBackfillRange) => void;
  onMaxItemsChange: (maxItems: number) => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const windowOptions: Array<{
    value: EvaluatorBackfillWindow;
    label: string;
    summaryLabel: string;
  }> = [
    {
      value: "24-hours",
      label: tFeatures("evalsMore:backfill.24hours"),
      summaryLabel: tFeatures("evalsMore:backfill.summary24hours"),
    },
    {
      value: "7-days",
      label: tFeatures("evalsMore:backfill.7days"),
      summaryLabel: tFeatures("evalsMore:backfill.summary7days"),
    },
    {
      value: "30-days",
      label: tFeatures("evalsMore:backfill.30days"),
      summaryLabel: tFeatures("evalsMore:backfill.summary30days"),
    },
    {
      value: "90-days",
      label: tFeatures("evalsMore:backfill.90days"),
      summaryLabel: tFeatures("evalsMore:backfill.summary90days"),
    },
    {
      value: "custom",
      label: tFeatures("evalsMore:backfill.custom"),
      summaryLabel: tFeatures("evalsMore:backfill.summaryCustom"),
    },
  ];
  const cappedCount = Math.min(matchingObservations, maxItems);
  const rangeDays = Math.max(
    1,
    Math.ceil(
      (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1_000),
    ),
  );
  const selectedWindowOption = windowOptions.find(
    (option) => option.value === selectedWindow,
  );
  const rangeDescription =
    selectedWindow === "custom"
      ? tFeatures("evalsMore:backfill.customDays", { days: rangeDays })
      : (selectedWindowOption?.summaryLabel ??
        tFeatures("evalsMore:backfill.summaryCustom"));

  return (
    <section className="ml-6 max-w-full min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <Switch
          id="evaluator-backfill-enabled"
          size="sm"
          checked={enabled}
          disabled={!canEnable}
          onCheckedChange={onEnabledChange}
        />
        <label
          htmlFor="evaluator-backfill-enabled"
          className={cn(
            "min-w-0 text-sm leading-none",
            canEnable ? "cursor-pointer" : "text-muted-foreground",
          )}
        >
          {tFeatures("ui.runEvaluatorOnPastObservationsMatchingTheseFilters")}
        </label>
      </div>

      {enabled ? (
        <div className="mt-3 ml-9 max-w-full min-w-0 space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            <Trans
              t={tFeatures}
              i18nKey="evalsMore:backfill.sentence"
              components={{
                limit: (
                  <Input
                    id="evaluator-backfill-max-items"
                    aria-label={tFeatures("ui.maxItems")}
                    type="number"
                    min={1}
                    max={maxAllowedItems}
                    className="w-20 text-right font-mono text-sm"
                    value={maxItems}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) return;
                      onMaxItemsChange(
                        Math.min(
                          maxAllowedItems,
                          Math.max(1, Math.floor(value)),
                        ),
                      );
                    }}
                  />
                ),
                window: (
                  <Select
                    value={selectedWindow}
                    onValueChange={(value) =>
                      onWindowChange(value as EvaluatorBackfillWindow)
                    }
                  >
                    <SelectTrigger
                      aria-label={tFeatures("ui.backfillTimeWindow")}
                      className="w-fit max-w-full whitespace-nowrap"
                      disableValueLineClamp
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {windowOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ),
              }}
            />
          </div>

          {selectedWindow === "custom" ? (
            <DateRangeInput
              value={{
                from: format(range.from, "yyyy-MM-dd"),
                to: format(range.to, "yyyy-MM-dd"),
              }}
              min={format(subMonths(new Date(), 6), "yyyy-MM-dd")}
              max={format(new Date(), "yyyy-MM-dd")}
              fromAriaLabel={tFeatures("evalsMore:backfill.startDate")}
              toAriaLabel={tFeatures("evalsMore:backfill.endDate")}
              onValueChange={(value) =>
                onRangeChange({
                  from: new Date(`${value.from}T00:00:00`),
                  to: new Date(`${value.to}T23:59:59.999`),
                })
              }
            />
          ) : null}

          <p className="text-muted-foreground text-xs break-words">
            {isEstimating
              ? tFeatures("ui.countingMatchingObservations")
              : matchingObservations > maxItems
                ? tFeatures("evalsMore:backfill.capped", {
                    total: numberFormatter(matchingObservations, 0),
                    range: rangeDescription,
                    limit: numberFormatter(cappedCount, 0),
                  })
                : tFeatures("evalsMore:backfill.withinLimit", {
                    total: numberFormatter(matchingObservations, 0),
                    range: rangeDescription,
                  })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
