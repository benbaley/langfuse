import { evalExecutionsFilterCols } from "@/src/server/api/definitions/evalExecutionsTable";
import type { FilterConfig } from "@/src/features/filters/lib/filter-config";

export const evalLogFilterConfig: FilterConfig = {
  tableName: "evalLogs",

  columnDefinitions: evalExecutionsFilterCols,

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
      type: "string" as const,
      column: "traceId",
      label: "Trace ID",
      labelKey: "field.trace_id",
    },
    {
      type: "string" as const,
      column: "executionTraceId",
      label: "Execution Trace ID",
      labelKey: "field.execution_trace_id",
    },
  ],
};
