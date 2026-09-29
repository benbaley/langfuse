import { useHasProjectAccess } from "@/src/features/rbac";
import {
  DeleteDatasetDialog,
  type DeleteDatasetDialogDataProps,
} from "@/src/features/datasets/components/DeleteDatasetDialog";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type DeleteDatasetDialogSource = "dataset" | "table-single-row";

export function DeleteDatasetDialogController({
  children,
  source,
  ...props
}: DeleteDatasetDialogDataProps & {
  source: DeleteDatasetDialogSource;
  children: (control: {
    disabled: { reason: string } | undefined;
    openDialog: () => void;
  }) => ReactNode;
}) {
  const { t: tMore } = useTranslation("coreMore");
  const capture = usePostHogClientCapture();
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });

  const disabled = hasAccess
    ? undefined
    : { reason: tMore("datasets.permissionDelete") };

  return (
    <DeleteDatasetDialog {...props}>
      {({ openDialog }) =>
        children({
          disabled,
          openDialog: () => {
            if (!hasAccess) return;

            openDialog();
            capture("datasets:delete_form_open", { source });
          },
        })
      }
    </DeleteDatasetDialog>
  );
}
