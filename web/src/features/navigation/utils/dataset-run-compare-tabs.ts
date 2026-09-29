import type { TFunction } from "i18next";
import { type ParsedUrlQuery } from "querystring";

export const DATASET_RUN_COMPARE_TABS = {
  COMPARE: "compare",
  CHARTS: "charts",
} as const;

export const getDatasetRunCompareTabs = (
  projectId: string,
  datasetId: string,
  t: TFunction<"navigation">,
) => [
  {
    value: DATASET_RUN_COMPARE_TABS.COMPARE,
    label: t("datasets.outputs"),
    href: `/project/${projectId}/datasets/${datasetId}/compare`,
    querySelector: (query: ParsedUrlQuery) => ({ runs: query.runs }),
  },
  {
    value: DATASET_RUN_COMPARE_TABS.CHARTS,
    label: t("datasets.charts"),
    href: `/project/${projectId}/datasets/${datasetId}/compare/charts`,
    querySelector: (query: ParsedUrlQuery) => ({ runs: query.runs }),
  },
];
