import { DatasetItemDiffView } from "./DatasetItemDiffView";
import type { DatasetItemDomain } from "@langfuse/shared";
import {
  stringifyDatasetItemData,
  type DatasetSchema,
} from "../utils/datasetItemUtils";
import { DatasetItemFields } from "@/src/features/datasets/components/DatasetItemFields";
import { useTranslation } from "react-i18next";

type DatasetItemVersionedContentProps = {
  itemAtVersion: DatasetItemDomain | null;
  latestItem: DatasetItemDomain | null;
  isLoadingVersioned: boolean;
  isLoadingLatest: boolean;
  showDiffMode: boolean;
  itemChangedAtVersion: boolean;
  dataset: DatasetSchema | null;
};

/**
 * Renders a dataset item at a specific historical version.
 * Supports diff view comparison with the latest version.
 * Handles loading states and cases where item doesn't exist at that version.
 */
export const DatasetItemVersionedContent = ({
  itemAtVersion,
  latestItem,
  isLoadingVersioned,
  isLoadingLatest,
  showDiffMode,
  itemChangedAtVersion,
  dataset,
}: DatasetItemVersionedContentProps) => {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  // Loading states
  if (isLoadingVersioned) {
    return (
      <div className="text-muted-foreground text-sm">
        {tFeatures("ui.loading")}
      </div>
    );
  }

  // Item doesn't exist at this version
  if (itemAtVersion === null) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-bold">
            {tFeatures("ui.itemDoesNotExistAtThisVersion")}
          </p>
          <p className="mt-2 text-sm">{tMore("datasets.missingVersion")}</p>
        </div>
      </div>
    );
  }

  // Show diff mode if enabled and item changed at this version
  if (showDiffMode && itemChangedAtVersion) {
    if (isLoadingLatest) {
      return (
        <div className="text-muted-foreground text-sm">
          {tFeatures("ui.loading")}
        </div>
      );
    }

    // Can't show diff if latest doesn't exist
    if (latestItem === null) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-bold">
              {tFeatures("ui.cannotShowDiff")}
            </p>
            <p className="mt-2 text-sm">
              {tFeatures(
                "ui.theLatestVersionOfThisItemDoesNotExistHasBeenDeleted",
              )}
            </p>
          </div>
        </div>
      );
    }

    return (
      <DatasetItemDiffView
        selectedVersion={itemAtVersion}
        latestVersion={latestItem}
      />
    );
  }

  // Show normal view of selected version
  return (
    <DatasetItemFields
      values={{
        input: stringifyDatasetItemData(itemAtVersion.input),
        expectedOutput: stringifyDatasetItemData(itemAtVersion.expectedOutput),
        metadata: stringifyDatasetItemData(itemAtVersion.metadata),
      }}
      dataset={dataset}
      editable={false}
      projectId={itemAtVersion.projectId}
      datasetItemId={itemAtVersion.id}
      datasetItemValidFrom={itemAtVersion.validFrom}
    />
  );
};
