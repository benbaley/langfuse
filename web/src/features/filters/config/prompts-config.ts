import { promptsTableCols } from "@langfuse/shared";
import type { FilterConfig } from "@/src/features/filters/lib/filter-config";

export const promptFilterConfig: FilterConfig = {
  tableName: "prompts",

  columnDefinitions: promptsTableCols,

  defaultExpanded: ["type"],

  defaultSidebarCollapsed: true,

  facets: [
    {
      type: "categorical" as const,
      column: "type",
      label: "Type",
      labelKey: "field.type",
    },
    {
      type: "categorical" as const,
      column: "labels",
      label: "Labels",
      labelKey: "field.labels",
    },
    {
      type: "categorical" as const,
      column: "tags",
      label: "Tags",
      labelKey: "field.tags",
    },
    {
      type: "numeric" as const,
      column: "version",
      label: "Version",
      labelKey: "field.version",
      min: 1,
      max: 100,
    },
  ],
};
