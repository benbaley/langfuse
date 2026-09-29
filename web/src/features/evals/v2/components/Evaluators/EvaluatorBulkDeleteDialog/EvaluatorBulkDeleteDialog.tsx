import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { useTranslation } from "react-i18next";

export function EvaluatorBulkDeleteDialog({
  open,
  scope,
  isDeleting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  scope: "selected" | "allMatching";
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        scope === "allMatching"
          ? tFeatures("ui.deleteAllMatchingEvaluators")
          : tFeatures("ui.deleteSelectedEvaluators")
      }
      description={tFeatures(
        "ui.allVersionsAndEvaluationRuleAssignmentsWillBeDeleted",
      )}
      confirmLabel="Delete evaluators"
      loading={isDeleting}
      onConfirm={onConfirm}
    />
  );
}
