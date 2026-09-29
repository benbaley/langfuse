import type { TFunction } from "i18next";
export const DATASET_TABS = {
  ITEMS: "items",
  EXPERIMENTS: "experiments",
} as const;

export const getDatasetTabs = (
  projectId: string,
  datasetId: string,
  t: TFunction<"navigation">,
) => {
  return [
    {
      value: DATASET_TABS.ITEMS,
      label: t("datasets.items"),
      href: `/project/${projectId}/datasets/${encodeURIComponent(datasetId)}/items`,
    },
    {
      value: DATASET_TABS.EXPERIMENTS,
      label: t("datasets.experiments"),
      href: `/project/${projectId}/datasets/${encodeURIComponent(datasetId)}/experiments`,
    },
  ];
};
