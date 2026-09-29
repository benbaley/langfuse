import { Bot, Copy, Edit, LockIcon, Trash } from "lucide-react";
import { type ComponentProps, useMemo } from "react";

import { DropdownMenu } from "@/src/components/design-system/DropdownMenu/DropdownMenu";
import { DeleteDatasetDialogController } from "@/src/features/datasets/components/DeleteDatasetDialogController";
import { DuplicateDatasetDialogController } from "@/src/features/datasets/components/DuplicateDatasetDialogController";
import { UpdateDatasetDialogController } from "@/src/features/datasets/components/UpdateDatasetDialogController";
import { useTranslation } from "react-i18next";

type DatasetActionMenuProps = Omit<
  ComponentProps<typeof UpdateDatasetDialogController>,
  "children" | "source"
> & {
  children: ComponentProps<typeof DropdownMenu>["children"];
  manageEvaluatorsHref?: string;
};

type ActionControl = {
  disabled: { reason: string } | undefined;
  openDialog: () => void;
};

function DatasetActionDropdown({
  deleteControl,
  duplicateControl,
  children,
  manageEvaluatorsHref,
  updateControl,
}: {
  deleteControl: ActionControl;
  duplicateControl: ActionControl;
  children: ComponentProps<typeof DropdownMenu>["children"];
  manageEvaluatorsHref?: string;
  updateControl: ActionControl;
}) {
  const { t: tFeatures } = useTranslation("features");
  const items = useMemo<ComponentProps<typeof DropdownMenu>["items"]>(
    () => [
      {
        type: "item",
        id: "edit",
        title: tFeatures("ui.edit"),
        icon: updateControl.disabled ? LockIcon : Edit,
        disabled: updateControl.disabled,
        onClick: updateControl.openDialog,
      },
      {
        type: "item",
        id: "duplicate",
        title: tFeatures("ui.duplicate"),
        icon: duplicateControl.disabled ? LockIcon : Copy,
        disabled: duplicateControl.disabled,
        onClick: duplicateControl.openDialog,
      },
      {
        type: "item",
        id: "delete",
        title: tFeatures("ui.delete"),
        icon: deleteControl.disabled ? LockIcon : Trash,
        disabled: deleteControl.disabled,
        onClick: deleteControl.openDialog,
      },
      ...(manageEvaluatorsHref
        ? [
            {
              type: "item" as const,
              id: "manage-evaluators",
              title: tFeatures("ui.manageEvaluators"),
              icon: Bot,
              href: manageEvaluatorsHref,
            },
          ]
        : []),
    ],
    [
      tFeatures,
      deleteControl,
      duplicateControl,
      manageEvaluatorsHref,
      updateControl,
    ],
  );

  return (
    <DropdownMenu items={items} placement="bottom-end">
      {children}
    </DropdownMenu>
  );
}

export function DatasetActionMenu({
  children,
  manageEvaluatorsHref,
  ...datasetProps
}: DatasetActionMenuProps) {
  return (
    <UpdateDatasetDialogController {...datasetProps} source="dataset">
      {(updateControl) => (
        <DuplicateDatasetDialogController
          projectId={datasetProps.projectId}
          datasetId={datasetProps.datasetId}
        >
          {(duplicateControl) => (
            <DeleteDatasetDialogController
              projectId={datasetProps.projectId}
              datasetId={datasetProps.datasetId}
              datasetName={datasetProps.datasetName}
              redirectUrl={`/project/${datasetProps.projectId}/datasets`}
              source="dataset"
            >
              {(deleteControl) => (
                <DatasetActionDropdown
                  updateControl={updateControl}
                  duplicateControl={duplicateControl}
                  deleteControl={deleteControl}
                  manageEvaluatorsHref={manageEvaluatorsHref}
                >
                  {children}
                </DatasetActionDropdown>
              )}
            </DeleteDatasetDialogController>
          )}
        </DuplicateDatasetDialogController>
      )}
    </UpdateDatasetDialogController>
  );
}
