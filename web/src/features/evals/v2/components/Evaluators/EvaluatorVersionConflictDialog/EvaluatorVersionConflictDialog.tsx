import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { useTranslation } from "react-i18next";

export function EvaluatorVersionConflictDialog({
  open,
  isOverriding,
  onOpenChange,
  onDiscard,
  onOverride,
}: {
  open: boolean;
  isOverriding: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void | Promise<void>;
  onOverride: () => void | Promise<void>;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={tFeatures("ui.thisEvaluatorWasUpdated")}
      description={tFeatures("evalsMore:version.conflict")}
      cancelLabel={tFeatures("evalsMore:version.discard")}
      onCancel={onDiscard}
      confirmLabel={tFeatures("evalsMore:version.override")}
      confirmVariant="default"
      loading={isOverriding}
      onConfirm={onOverride}
    />
  );
}
