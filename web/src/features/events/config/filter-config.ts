import { eventsTableCols, type FilterState } from "@langfuse/shared";
import {
  omitFilterFacets,
  type FilterConfig,
} from "@/src/features/filters/lib/filter-config";
import { renderFilterIcon } from "@/src/components/ItemBadge";
import { renderLevelIcon } from "@/src/components/level-colors";

// Helper function to get column name from eventsTableCols by ID
export const getEventsColumnName = (id: string): string => {
  const column = eventsTableCols.find((col) => col.id === id);
  if (!column) {
    throw new Error(`Column ${id} not found in eventsTableCols`);
  }
  return column.name;
};

const isBooleanEqualityOperator = (operator: string): operator is "=" | "<>" =>
  operator === "=" || operator === "<>";

const migrateLegacyRootObservationFilters = (
  filters: FilterState,
): FilterState => {
  const hasRootObservationFilter = filters.some(
    (filter) =>
      filter.column === "isRootObservation" &&
      filter.type === "boolean" &&
      isBooleanEqualityOperator(filter.operator),
  );

  return filters.flatMap((filter) => {
    if (
      filter.column === "isRootObservation" &&
      filter.type === "boolean" &&
      isBooleanEqualityOperator(filter.operator)
    ) {
      return [
        {
          ...filter,
          operator: "=" as const,
          value: filter.operator === "<>" ? !filter.value : filter.value,
        },
      ];
    }

    if (
      (filter.column === "hasParentObservation" ||
        filter.column === "Has Parent Observation") &&
      filter.type === "boolean" &&
      isBooleanEqualityOperator(filter.operator)
    ) {
      if (hasRootObservationFilter) {
        return [];
      }

      return [
        {
          ...filter,
          column: "isRootObservation",
          operator: "=" as const,
          value: filter.operator === "=" ? !filter.value : filter.value,
        },
      ];
    }

    return [filter];
  });
};

export type ObservationEventsOmittableFilterColumn =
  | "sessionId"
  | "userId"
  | "promptName";

export const observationEventsFilterConfig: FilterConfig = {
  tableName: "observations-events",

  columnDefinitions: eventsTableCols,

  defaultExpanded: ["environment", "name", "isRootObservation", "type"],

  migrateFilterState: migrateLegacyRootObservationFilters,

  // Observation-table facet order follows real sidebar usage (PostHog
  // `filters:applied`): the most-applied columns sit at the top.
  facets: [
    {
      type: "boolean" as const,
      column: "isRootObservation",
      label: "Is Root Observation",
      labelKey: "field.is_root_observation",
      tooltip:
        "A root observation is top-level in a trace or marked as an app root by the SDK. Filter to 'True' to see root-level observations.",
      tooltipKey: "help.rootObservation",
    },
    {
      type: "categorical" as const,
      column: "name",
      label: getEventsColumnName("name"),
      labelKey: "field.name",
    },
    {
      type: "categorical" as const,
      column: "type",
      label: getEventsColumnName("type"),
      labelKey: "field.type",
      help: {
        description:
          "Observation types classify the work captured within a trace, such as generations, spans, tools, chains, and agents.",
        descriptionKey: "help.observationType",
        href: "https://langfuse.com/docs/observability/features/observation-types",
      },
      renderIcon: renderFilterIcon,
    },
    {
      type: "categorical" as const,
      column: "environment",
      label: getEventsColumnName("environment"),
      labelKey: "field.environment",
    },
    {
      type: "categorical" as const,
      column: "traceName",
      label: getEventsColumnName("traceName"),
      labelKey: "field.trace_name",
    },
    {
      type: "stringKeyValue" as const,
      column: "metadata",
      label: getEventsColumnName("metadata"),
      labelKey: "field.metadata",
    },
    {
      // Tags are a primary, user-defined filter — keep them near the identity
      // facets at the top of the sidebar rather than buried mid-list (LFE-10494).
      type: "categorical" as const,
      column: "traceTags",
      label: getEventsColumnName("traceTags"),
      labelKey: "field.trace_tags",
    },
    {
      type: "categorical" as const,
      column: "sessionId",
      label: getEventsColumnName("sessionId"),
      labelKey: "field.session_id",
    },
    {
      type: "categorical" as const,
      column: "userId",
      label: getEventsColumnName("userId"),
      labelKey: "field.user_id",
    },
    {
      type: "string" as const,
      column: "traceId",
      label: getEventsColumnName("traceId"),
      labelKey: "field.trace_id",
    },
    {
      // Display name comes from eventsTableCols so the sidebar and table
      // column stay aligned. Column id stays `level`.
      type: "categorical" as const,
      column: "level",
      label: getEventsColumnName("level"),
      labelKey: "field.status",
      renderIcon: renderLevelIcon,
    },
    {
      type: "categorical" as const,
      column: "providedModelName",
      label: getEventsColumnName("providedModelName"),
      labelKey: "field.provided_model_name",
    },
    {
      type: "categorical" as const,
      column: "promptName",
      label: getEventsColumnName("promptName"),
      labelKey: "field.prompt_name",
    },
    {
      type: "numeric" as const,
      column: "latency",
      label: getEventsColumnName("latency"),
      labelKey: "field.latency_s",
      min: 0,
      max: 60,
      unit: "s",
    },
    {
      type: "numericKeyValue" as const,
      column: "scores_avg",
      label: "Numeric Scores",
      labelKey: "field.numeric_scores",
    },
    {
      type: "categorical" as const,
      column: "modelId",
      label: getEventsColumnName("modelId"),
      labelKey: "field.model_id",
    },
    {
      type: "categorical" as const,
      column: "version",
      label: getEventsColumnName("version"),
      labelKey: "field.version",
    },
    {
      type: "categorical" as const,
      column: "release",
      label: getEventsColumnName("release"),
      labelKey: "field.release",
    },
    {
      type: "string" as const,
      column: "statusMessage",
      label: getEventsColumnName("statusMessage"),
      labelKey: "field.status_message",
    },
    {
      type: "categorical" as const,
      column: "ingestionApiKey",
      label: getEventsColumnName("ingestionApiKey"),
      labelKey: "field.api_key",
    },
    {
      type: "categorical" as const,
      column: "ingestionSdkName",
      label: getEventsColumnName("ingestionSdkName"),
      labelKey: "field.sdk_name",
    },
    {
      type: "categorical" as const,
      column: "ingestionSdkVersion",
      label: getEventsColumnName("ingestionSdkVersion"),
      labelKey: "field.sdk_version",
    },
    {
      type: "categorical" as const,
      column: "ingestionSource",
      label: getEventsColumnName("ingestionSource"),
      labelKey: "field.ingestion_source",
    },
    {
      type: "categorical" as const,
      column: "experimentDatasetId",
      label: getEventsColumnName("experimentDatasetId"),
      labelKey: "field.experiment_dataset_id",
    },
    {
      type: "categorical" as const,
      column: "experimentId",
      label: getEventsColumnName("experimentId"),
      labelKey: "field.experiment_id",
    },
    {
      type: "categorical" as const,
      column: "experimentName",
      label: getEventsColumnName("experimentName"),
      labelKey: "field.experiment_name",
    },
    {
      type: "numeric" as const,
      column: "timeToFirstToken",
      label: getEventsColumnName("timeToFirstToken"),
      labelKey: "field.time_to_first_token_s",
      min: 0,
      max: 60,
      unit: "s",
    },
    {
      type: "numeric" as const,
      column: "inputTokens",
      label: getEventsColumnName("inputTokens"),
      labelKey: "field.input_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "cachedInputTokens",
      label: getEventsColumnName("cachedInputTokens"),
      labelKey: "field.cached_input_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "outputTokens",
      label: getEventsColumnName("outputTokens"),
      labelKey: "field.output_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "totalTokens",
      label: getEventsColumnName("totalTokens"),
      labelKey: "field.total_tokens",
      min: 0,
      max: 1000000,
    },
    {
      type: "numeric" as const,
      column: "inputCost",
      label: getEventsColumnName("inputCost"),
      labelKey: "field.input_cost",
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "cachedInputCost",
      label: getEventsColumnName("cachedInputCost"),
      labelKey: "field.cached_input_cost",
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "outputCost",
      label: getEventsColumnName("outputCost"),
      labelKey: "field.output_cost",
      min: 0,
      max: 100,
      unit: "$",
    },
    {
      type: "numeric" as const,
      column: "totalCost",
      label: getEventsColumnName("totalCost"),
      labelKey: "field.cost",
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

export function getObservationEventsFilterConfig(
  omittedFilter: ObservationEventsOmittableFilterColumn[] = [],
): FilterConfig {
  return omitFilterFacets(observationEventsFilterConfig, omittedFilter);
}
