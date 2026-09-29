import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRef, useState } from "react";
import { NewDatasetItemForm } from "@/src/features/datasets/components/NewDatasetItemForm";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useHasProjectAccess } from "@/src/features/rbac";
import { ActionButton } from "@/src/components/ActionButton";
import { useTranslation } from "react-i18next";

export const NewDatasetItemButton = (props: {
  projectId: string;
  datasetId?: string;
}) => {
  const { t: tFeatures } = useTranslation("features");
  const [open, setOpen] = useState(false);
  const submissionPending = useRef(false);
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "datasets:CUD",
  });
  return (
    <Dialog
      open={hasAccess && open}
      onOpenChange={(next) => {
        if (!submissionPending.current) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <ActionButton
          variant="outline"
          hasAccess={hasAccess}
          trackingEventName="dataset_item:new_form_open"
          icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
        >
          {tFeatures("ui.newItem")}
        </ActionButton>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{tFeatures("ui.createNewDatasetItem")}</DialogTitle>
        </DialogHeader>
        <NewDatasetItemForm
          projectId={props.projectId}
          datasetId={props.datasetId}
          onPendingChange={(pending) => {
            submissionPending.current = pending;
          }}
          onFormSuccess={() => setOpen(false)}
          className="h-full overflow-y-auto"
        />
      </DialogContent>
    </Dialog>
  );
};
