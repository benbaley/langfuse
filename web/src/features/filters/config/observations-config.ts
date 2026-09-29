import { observationsTableCols } from "@langfuse/shared";
import {
  omitFilterFacets,
  type FilterConfig,
} from "@/src/features/filters/lib/filter-config";
import type { ColumnToBackendKeyMap } from "@/src/features/filters/lib/filter-transform";
import { renderFilterIcon } from "@/src/components/ItemBadge";
import { renderLevelIcon } from "@/src/components/level-colors";

export type ObservationsOmittableFilterColumn = "model" | "promptName";

/**
 * Maps frontend column IDs to backend-expected column IDs
 * Frontend uses "tags" but backend CH mapping expects "traceTags" for trace tags on observations table
 */
export const OBSERVATION_COLUMN_TO_BACKEND_KEY: ColumnToBackendKeyMap = {
  tags: "traceTags",
};

export const observationFilterConfig: FilterConfig = {
  tableName: "observations",

  columnDefinitions: observationsTableCols,

  defaultExpanded: ["environment", "name"],

  facets: [
    {
      type: "categorical" as const,
      column: "environment",
      label: "Environment",
      labelKey: "field.environment",
    },
    {
      type: "categorical" as const,
      column: "type",
      label: "Type",
      labelKey: "field.type",
      renderIcon: renderFilterIcon,
    },
    {
      type: "categorical" as const,
      column: "name",
      label: "Name",
      labelKey: "field.name",
    },
    {
      type: "categorical" as const,
      column: "traceName",
      label: "Trace Name",
      labelKey: "field.trace_name",
    },
    {
      // Tags are a primary, user-defined filter — keep them near the identity
      // facets at the top of the sidebar rather than buried mid-list (LFE-10494).
      type: "categorical" as const,
      column: "tags",
      label: "Trace Tags",
      labelKey: "field.trace_tags",
    },
    {
      // Display name is "Status"; column id stays `level` to match the
      // observation-level API field and saved filters.
      type: "categorical" as const,
      column: "level",
      label: "Status",
      labelKey: "field.status",
      renderIcon: renderLevelIcon,
    },
    {
      type: "categorical" as const,
      column: "model",
      label: "Model",
      labelKey: "field.model",
    },
    {
      type: "categorical" as const,
      column: "modelId",
      label: "Model ID",
      labelKey: "field.model_id",
    },
    {
      type: "categorical" as const,
      column: "promptName",
      label: "Prompt Name",
      labelKey: "field.prompt_name",
    },
    {
      type: "stringKeyValue" as const,
      column: "metadata",
      label: "Metadata",
      labelKey: "field.metadata",
    },
    {
      type: "string" as const,
      column: "version",
      label: "Version",
      labelKey: "field.version",
    },
    {
      type: "numeric" as const,
      column: "latency",
      label: "Latency",
      labelKey: "field.latency",
      min: 0,
      max: 60,
      unit: "s",
    },
    {
      type: "numeric" as const,
      column: "timeToFirstToken",
      label: "Time to First Token",
      labelKey: "field.time_to_first_token",
      min: 0,
      max: 60,
      unit: "s",
    },
    {
      type: "numeric" as const,
      column: "inputTokens",
      label: "Input Tokens",
      labelKey: "field.input_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "outputTokens",
      label: "Output Tokens",
      labelKey: "field.output_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "totalTokens",
      label: "Total Tokens",
      labelKey: "field.total_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "inputCost",
      label: "Input Cost",
      labelKey: "field.input_cost",
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "outputCost",
      label: "Output Cost",
      labelKey: "field.output_cost",
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "totalCost",
      label: "Total Cost",
      labelKey: "field.total_cost",
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "categorical" as const,
      column: "toolNames",
      label: "Tool Names (Available)",
      labelKey: "field.tool_names_available",
    },
    {
      type: "categorical" as const,
      column: "calledToolNames",
      label: "Tool Names (Called)",
      labelKey: "field.tool_names_called",
    },
    {
      type: "numeric" as const,
      column: "toolDefinitions",
      label: "Available Tools",
      labelKey: "field.available_tools",
      min: 0,
      max: 25,
    },
    {
      type: "numeric" as const,
      column: "toolCalls",
      label: "Tool Calls",
      labelKey: "field.tool_calls",
      min: 0,
      max: 25,
    },
    {
      type: "keyValue" as const,
      column: "score_categories",
      label: "Categorical Scores",
      labelKey: "field.categorical_scores",
    },
    {
      type: "numericKeyValue" as const,
      column: "scores_avg",
      label: "Numeric Scores",
      labelKey: "field.numeric_scores",
    },
    {
      type: "booleanKeyValue" as const,
      column: "score_booleans",
      label: "Boolean Scores",
      labelKey: "field.boolean_scores",
    },
    {
      type: "numeric" as const,
      column: "commentCount",
      label: "Comment Count",
      labelKey: "field.comment_count",
      min: 0,
      max: 100,
    },
    {
      type: "string" as const,
      column: "commentContent",
      label: "Comment Content",
      labelKey: "field.comment_content",
    },
  ],
};

export function getObservationsFilterConfig(
  omittedFilter: ObservationsOmittableFilterColumn[] = [],
): FilterConfig {
  return omitFilterFacets(observationFilterConfig, omittedFilter);
}
