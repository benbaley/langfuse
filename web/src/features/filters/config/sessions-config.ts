import {
  omitFilterFacets,
  type Facet,
  type FilterConfig,
} from "@/src/features/filters/lib/filter-config";
import { sessionsEventsViewCols, sessionsViewCols } from "@langfuse/shared";
import type { ColumnToBackendKeyMap } from "@/src/features/filters/lib/filter-transform";

export type SessionOmittableFilterColumn = "userIds";

/**
 * Maps frontend column IDs to backend-expected column IDs
 * Frontend uses "tags" but backend CH mapping expects "traceTags" for trace tags on sessions table
 */
export const SESSION_COLUMN_TO_BACKEND_KEY: ColumnToBackendKeyMap = {
  tags: "traceTags",
};

export const sessionFilterConfig: FilterConfig = {
  tableName: "sessions",

  // Bookmarking is gone from the UI, so the sidebar no longer knows the
  // column: a `bookmarked` filter left in a saved view or an old deep link is
  // dropped rather than silently narrowing the rows nobody can widen again.
  // The shared definition stays for the public API.
  columnDefinitions: sessionsViewCols.filter((col) => col.id !== "bookmarked"),

  defaultExpanded: ["environment"],

  facets: [
    {
      type: "categorical" as const,
      column: "environment",
      label: "Environment",
      labelKey: "field.environment",
    },
    {
      type: "string" as const,
      column: "id",
      label: "Session ID",
      labelKey: "field.session_id",
    },
    {
      type: "categorical" as const,
      column: "userIds",
      label: "User IDs",
      labelKey: "field.user_ids",
    },
    {
      type: "categorical" as const,
      column: "tags",
      label: "Trace Tags",
      labelKey: "field.trace_tags",
    },
    {
      type: "numeric" as const,
      column: "sessionDuration",
      label: "Session Duration",
      labelKey: "field.session_duration",
      min: 0,
      max: 3600,
      unit: "s",
    },
    {
      type: "numeric" as const,
      column: "countTraces",
      label: "Traces Count",
      labelKey: "field.traces_count",
      min: 0,
      max: 1000,
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

const sessionMetadataFacet: Facet = {
  type: "stringKeyValue",
  column: "metadata",
  label: "Metadata",
  labelKey: "field.metadata",
};

export const sessionEventsFilterConfig: FilterConfig = {
  ...sessionFilterConfig,
  columnDefinitions: sessionsEventsViewCols.filter(
    (col) => col.id !== "bookmarked",
  ),
  facets: sessionFilterConfig.facets.flatMap((facet) =>
    facet.column === "tags" ? [facet, sessionMetadataFacet] : [facet],
  ),
};

export function getSessionFilterConfig(
  omittedFilter: SessionOmittableFilterColumn[] = [],
  fromEvents = false,
): FilterConfig {
  return omitFilterFacets(
    fromEvents ? sessionEventsFilterConfig : sessionFilterConfig,
    omittedFilter,
  );
}
