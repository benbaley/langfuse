import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { DatasetForm } from "@/src/features/datasets/components/DatasetForm";
import { useTranslation } from "react-i18next";

type CreateDatasetTarget =
  | { type: "root" }
  | { type: "folder"; prefix: string };

export interface CreateDatasetDialogProps {
  projectId: string;
  target: CreateDatasetTarget;
}

interface CreateDatasetDialogContentProps extends CreateDatasetDialogProps {
  onFormSuccess: () => void;
}

export function CreateDatasetDialogContent({
  projectId,
  target,
  onFormSuccess,
}: CreateDatasetDialogContentProps) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <DialogContent className="max-h-[90vh] sm:max-w-2xl md:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{tFeatures("ui.createNewDataset")}</DialogTitle>
      </DialogHeader>
      <DatasetForm
        mode="create"
        projectId={projectId}
        onFormSuccess={onFormSuccess}
        folderPrefix={target.type === "folder" ? target.prefix : undefined}
      />
    </DialogContent>
  );
}
