import { useId, useMemo } from "react";
import { Star } from "lucide-react";
import type { FilterState } from "@langfuse/shared";

import { Radio } from "@/src/components/design-system/Radio/Radio";
import type { LangfuseColumnDef } from "@/src/components/table/types";
import type { AbsoluteTimeRange } from "@/src/utils/date-range-utils";
import { compactNumberFormatter } from "@/src/utils/numbers";
import {
  SampleObservationSelectorBase,
  type SampleObservation,
} from "@/src/features/evals/v2/components/Evaluators/Testing/components/SampleObservationSelectorBase/SampleObservationSelectorBase";
import { EVALUATOR_FIELD_REGISTRY } from "@/src/features/evals/v2/constants/evaluatorSearchRegistry";
import { useTranslation } from "react-i18next";

const preserveObservedOptions: Parameters<
  typeof SampleObservationSelectorBase
>[0]["mapObservedOptions"] = (observed) => observed;

const resolveSelection: Parameters<
  typeof SampleObservationSelectorBase
>[0]["resolveSelection"] = (observations, selectedObservationId) => {
  const selectedObservationMatches = observations.some(
    (observation) => observation.id === selectedObservationId,
  );
  return (selectedObservationId === null && observations.length > 0) ||
    (selectedObservationId !== null && !selectedObservationMatches)
    ? (observations[0] ?? null)
    : undefined;
};

export function EvaluatorSampleObservationSelector({
  projectId,
  timeRange,
  selectedObservationId,
  filterState,
  onFilterStateChange,
  onSelect,
  onOpenTrace,
}: {
  projectId: string;
  timeRange: AbsoluteTimeRange | null;
  selectedObservationId: string | null;
  filterState: FilterState;
  onFilterStateChange: (filters: FilterState) => void;
  onSelect: (observation: SampleObservation | null) => void;
  onOpenTrace: (observation: SampleObservation) => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const selectionGroupName = useId();
  const leadingColumns = useMemo<LangfuseColumnDef<SampleObservation>[]>(
    () => [
      {
        accessorKey: "sample",
        id: "sample",
        header: () => (
          <div className="flex w-full justify-center">
            <Star aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">{tFeatures("ui.sample")}</span>
          </div>
        ),
        headerBlock: true,
        headerLabel: tFeatures("ui.sample"),
        size: 72,
        enableHiding: false,
        isFixedPosition: true,
        isPinnedLeft: true,
        cellPadding: "none",
        cell: ({ row }) => (
          <label
            className="flex h-full w-full cursor-pointer items-center justify-center px-2"
            htmlFor={`sample-selection-${selectionGroupName}-${row.original.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <Radio
              id={`sample-selection-${selectionGroupName}-${row.original.id}`}
              name={selectionGroupName}
              checked={selectedObservationId === row.original.id}
              aria-label={tFeatures("evalsMore:sample.use", {
                name: row.original.name ?? row.original.id,
              })}
              onChange={() => onSelect(row.original)}
            />
          </label>
        ),
      },
    ],
    [tFeatures, onSelect, selectedObservationId, selectionGroupName],
  );

  return (
    <SampleObservationSelectorBase
      projectId={projectId}
      timeRange={timeRange}
      filterState={filterState}
      onFilterStateChange={onFilterStateChange}
      previewFilters={filterState}
      tableName="evaluator-sample-observations"
      registry={EVALUATOR_FIELD_REGISTRY}
      selectedObservationId={selectedObservationId}
      onSelect={onSelect}
      onOpenTrace={onOpenTrace}
      leadingColumns={leadingColumns}
      resolveSelection={resolveSelection}
      getRowClassName={(observation) =>
        observation.id === selectedObservationId ? "bg-muted/50" : ""
      }
      filterDescription={tFeatures("evalsMore:sample.evalDescription")}
      filterTooltip={tFeatures("evalsMore:sample.evalTooltip")}
      matchingDescription={tFeatures("evalsMore:sample.evalMatches")}
      matchingTooltip={tFeatures("evalsMore:sample.evalMatchTooltip")}
      formatCount={(count) =>
        tFeatures("evalsMore:sample.matchCount", {
          count,
          total: compactNumberFormatter(count),
        })
      }
      mapObservedOptions={preserveObservedOptions}
    />
  );
}
