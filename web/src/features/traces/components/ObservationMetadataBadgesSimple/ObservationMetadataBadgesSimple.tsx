import { useTranslation } from "react-i18next";
/* eslint-disable @repo/no-null-render */
/**
 * Simple metadata badges for ObservationDetailView
 * Each badge handles its own null checks and returns null when data is unavailable
 */

import { Badge } from "@/src/components/design-system/Badge/Badge";
import { formatIntervalSeconds } from "@/src/utils/dates";

export function LatencyBadge({
  latencySeconds,
}: {
  latencySeconds: number | null;
}) {
  const { t: tMore } = useTranslation("coreMore");
  if (latencySeconds == null) return null;

  return (
    <Badge
      text={tMore("traces.latency", {
        value: formatIntervalSeconds(latencySeconds),
      })}
    />
  );
}

export function TimeToFirstTokenBadge({
  timeToFirstToken,
}: {
  timeToFirstToken: number | null | undefined;
}) {
  const { t: tMore } = useTranslation("coreMore");
  if (timeToFirstToken == null) return null;

  return (
    <Badge
      text={tMore("traces.firstToken", {
        value: formatIntervalSeconds(timeToFirstToken),
      })}
    />
  );
}
