import { useTranslation } from "react-i18next";
import { Tooltip } from "@/src/components/design-system/Tooltip/Tooltip";

type NotRecordedMetricProps = { metric: "cost" | "latency" };

/**
 * A bare `0` or `-` for cost or latency reads as broken instrumentation, so name
 * what is missing instead.
 */
export const NotRecordedMetric = ({ metric }: NotRecordedMetricProps) => {
  const { t: tMore } = useTranslation("coreMore");
  return (
    <Tooltip label={tMore(`experiments.missing.${metric}`)}>
      {({ getTriggerProps }) => (
        <span
          {...getTriggerProps()}
          className="text-muted-foreground/70 cursor-default"
        >
          {tMore("experiments.notRecorded")}
        </span>
      )}
    </Tooltip>
  );
};
