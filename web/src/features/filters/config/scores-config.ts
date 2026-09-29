import { scoresTableCols } from "@/src/server/api/definitions/scoresTable";
import type { FilterConfig } from "@/src/features/filters/lib/filter-config";
import type { ColumnToBackendKeyMap } from "@/src/features/filters/lib/filter-transform";
import { type FilterState } from "@langfuse/shared";

// Maps frontend column IDs to backend-expected column IDs
// Frontend uses "tags" but backend CH mapping expects "trace_tags" for trace tags on scores table
export const SCORE_COLUMN_TO_BACKEND_KEY: ColumnToBackendKeyMap = {
  tags: "trace_tags",
};

export type ScoresTableHiddenColumn =
  | "traceId"
  | "traceName"
  | "observationId"
  | "jobConfigurationId"
  | "userId"
  | "traceTags";

const SCORES_HIDDEN_COLUMN_TO_FILTER_COLUMN: Partial<
  Record<ScoresTableHiddenColumn, string>
> = {
  traceTags: "tags",
};

const scoreFilterConfig: FilterConfig = {
  tableName: "scores",

  columnDefinitions: scoresTableCols,

  defaultExpanded: ["environment", "name"],

  defaultSidebarCollapsed: true,

  facets: [
    {
      type: "categorical" as const,
      column: "environment",
      label: "Environment",
      labelKey: "field.environment",
    },
    {
      type: "categorical" as const,
      column: "name",
      label: "Name",
      labelKey: "field.name",
    },
    {
      type: "categorical" as const,
      column: "source",
      label: "Source",
      labelKey: "field.source",
    },
    {
      type: "boolean" as const,
      column: "isEvaluatorTest",
      label: "Evaluator Test",
      labelKey: "field.evaluator_test",
    },
    {
      type: "categorical" as const,
      column: "dataType",
      label: "Data Type",
      labelKey: "field.data_type",
    },
    {
      type: "stringKeyValue" as const,
      column: "metadata",
      label: "Metadata",
      labelKey: "field.metadata",
    },
    {
      type: "numeric" as const,
      column: "value",
      label: "Numeric Value",
      labelKey: "field.numeric_value",
      tooltip:
        "Filters scores by numeric value. For BOOLEAN scores, use the 'Boolean Value' filter below. For CATEGORICAL scores, use the 'Categorical Value' filter below.",
      tooltipKey: "help.numericScore",
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      type: "categorical" as const,
      column: "booleanValue",
      label: "Boolean Value",
      labelKey: "field.boolean_value",
      tooltip: "Filters BOOLEAN scores by true or false.",
      tooltipKey: "help.booleanScore",
      disableTextFilter: true,
    },
    {
      type: "categorical" as const,
      column: "stringValue",
      label: "Categorical Value",
      labelKey: "field.categorical_value",
      tooltip:
        "Filters scores by string value. Applies to CATEGORICAL data type scores only.",
      tooltipKey: "help.categoricalScore",
    },
    {
      type: "string" as const,
      column: "traceId",
      label: "Trace ID",
      labelKey: "field.trace_id",
    },
    {
      type: "string" as const,
      column: "sessionId",
      label: "Session ID",
      labelKey: "field.session_id",
    },
    {
      type: "categorical" as const,
      column: "traceName",
      label: "Trace Name",
      labelKey: "field.trace_name",
    },
    {
      type: "string" as const,
      column: "observationId",
      label: "Observation ID",
      labelKey: "field.observation_id",
    },
    {
      type: "categorical" as const,
      column: "userId",
      label: "User ID",
      labelKey: "field.user_id",
    },
    {
      type: "categorical" as const,
      column: "tags",
      label: "Trace Tags",
      labelKey: "field.trace_tags",
    },
  ],
};

/**
 * Scopes the scores table to one observation. `includeTraceLevelScores` widens it
 * to the trace's trace-level scores as well — `observation_id` is `''`-equals-NULL
 * in the ClickHouse mapping, so "any of ['', id]" is the OR, matching each score
 * row once (LFE-14405).
 */
export function observationScopeFilter(
  observationId: string | undefined,
  includeTraceLevelScores: boolean,
): FilterState {
  if (!observationId) return [];
  return includeTraceLevelScores
    ? [
        {
          column: "observationId",
          type: "stringOptions",
          operator: "any of",
          value: ["", observationId],
        },
      ]
    : [
        {
          column: "observationId",
          type: "string",
          operator: "=",
          value: observationId,
        },
      ];
}

export function getScoreFilterConfig(
  hiddenColumns: ScoresTableHiddenColumn[] = [],
): FilterConfig {
  if (hiddenColumns.length === 0) {
    return scoreFilterConfig;
  }
  const hiddenColumnSet = new Set<string>(
    hiddenColumns.map(
      (column) => SCORES_HIDDEN_COLUMN_TO_FILTER_COLUMN[column] ?? column,
    ),
  );

  return {
    ...scoreFilterConfig,
    defaultExpanded: scoreFilterConfig.defaultExpanded?.filter(
      (column) => !hiddenColumnSet.has(column),
    ),
    facets: scoreFilterConfig.facets.filter(
      (facet) => !hiddenColumnSet.has(facet.column),
    ),
  };
}
