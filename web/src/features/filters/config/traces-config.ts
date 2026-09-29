import { tracesTableCols } from "@langfuse/shared";
import {
  omitFilterFacets,
  type FilterConfig,
} from "@/src/features/filters/lib/filter-config";
import { renderLevelIcon } from "@/src/components/level-colors";

export type TraceOmittableFilterColumn = "userId" | "sessionId";

export const traceFilterConfig: FilterConfig = {
  tableName: "traces",

  // Bookmarking is gone from the UI, so the sidebar no longer knows the
  // column: a `bookmarked` filter left in a saved view or an old deep link is
  // dropped rather than silently narrowing the rows nobody can widen again.
  // The shared definition stays for the public API.
  columnDefinitions: tracesTableCols.filter((col) => col.id !== "bookmarked"),

  defaultExpanded: ["environment", "traceName"],

  facets: [
    {
      type: "categorical" as const,
      column: "environment",
      label: "Environment",
      labelKey: "field.environment",
    },
    {
      type: "categorical" as const,
      column: "traceName",
      label: "Trace Name",
      labelKey: "field.trace_name",
    },
    {
      type: "string" as const,
      column: "id",
      label: "Trace ID",
      labelKey: "field.trace_id",
    },
    {
      type: "categorical" as const,
      column: "userId",
      label: "User ID",
      labelKey: "field.user_id",
    },
    {
      type: "categorical" as const,
      column: "sessionId",
      label: "Session ID",
      labelKey: "field.session_id",
    },
    {
      // Tags are a primary, user-defined filter — keep them near the identity
      // facets at the top of the sidebar rather than buried mid-list (LFE-10494).
      type: "categorical" as const,
      column: "traceTags",
      label: "Tags",
      labelKey: "field.tags",
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
      type: "string" as const,
      column: "release",
      label: "Release",
      labelKey: "field.release",
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
    {
      // Product direction is to call observation levels "Status" everywhere.
      // Display relabel only; the column id / grammar field stays `level`.
      type: "categorical" as const,
      column: "level",
      label: "Status",
      labelKey: "field.status",
      renderIcon: renderLevelIcon,
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
  ],
};

export function getTraceFilterConfig(
  omittedFilter: TraceOmittableFilterColumn[] = [],
): FilterConfig {
  return omitFilterFacets(traceFilterConfig, omittedFilter);
}
