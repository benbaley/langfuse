import { evalConfigsTableCols } from "@/src/server/api/definitions/evalConfigsTable";
import type { FilterConfig } from "@/src/features/filters/lib/filter-config";

export const evaluatorFilterConfig: FilterConfig = {
  tableName: "evaluators",

  columnDefinitions: evalConfigsTableCols,

  defaultExpanded: ["status"],

  defaultSidebarCollapsed: true,

  facets: [
    {
      type: "categorical" as const,
      column: "status",
      label: "Status",
      labelKey: "field.status",
    },
    {
      type: "categorical" as const,
      column: "target",
      label: "Target",
      labelKey: "field.target",
    },
    {
      type: "categorical" as const,
      column: "timeScope",
      label: "Time Scope",
      labelKey: "field.time_scope",
    },
  ],
};
