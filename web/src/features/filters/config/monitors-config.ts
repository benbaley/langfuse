import { monitorsTableCols } from "@langfuse/shared";
import type { FilterConfig } from "@/src/features/filters/lib/filter-config";

const baseFacets: FilterConfig["facets"] = [
  {
    type: "categorical" as const,
    column: "severity",
    label: "Severity",
    labelKey: "field.severity",
    disableTextFilter: true,
  },
  {
    type: "categorical" as const,
    column: "tags",
    label: "Tags",
    labelKey: "field.tags",
  },
];

export const monitorFilterConfig: FilterConfig = {
  tableName: "monitors",
  columnDefinitions: monitorsTableCols,
  defaultExpanded: ["severity", "tags"],
  defaultSidebarCollapsed: false,
  facets: baseFacets,
};

/** Adds the evaluator facet only when the project has evaluator-specific alerts. */
export const getMonitorFilterConfig = (
  hasEvaluatorOptions: boolean,
): FilterConfig =>
  hasEvaluatorOptions
    ? {
        ...monitorFilterConfig,
        defaultExpanded: ["severity", "evaluatorId", "tags"],
        facets: [
          baseFacets[0],
          {
            type: "categorical" as const,
            column: "evaluatorId",
            label: "Evaluator",
            labelKey: "field.evaluator",
            disableTextFilter: true,
            getOptionTitle: (value, displayLabel) =>
              `${displayLabel} (${value})`,
          },
          baseFacets[1],
        ],
      }
    : monitorFilterConfig;
