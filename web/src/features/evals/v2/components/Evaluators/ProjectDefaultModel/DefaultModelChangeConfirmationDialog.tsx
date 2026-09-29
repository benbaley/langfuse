import { ArrowRight } from "lucide-react";

import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import type { JudgeModel } from "@/src/features/evals/v2/judgeModel";
import { useTranslation } from "react-i18next";

export function DefaultModelChangeConfirmationDialog({
  open,
  currentModel,
  nextModel,
  loading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  currentModel: JudgeModel | null;
  nextModel: JudgeModel;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={tFeatures("ui.setProjectDefaultModel")}
      description={tFeatures("evalsMore:model.defaultDescription")}
      confirmLabel={
        currentModel
          ? tFeatures("evalsMore:model.updateDefault")
          : tFeatures("evalsMore:model.setDefault")
      }
      confirmVariant="default"
      loading={loading}
      onConfirm={onConfirm}
    >
      <div className="bg-muted flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-sm">
        {currentModel ? (
          <>
            <span
              className="truncate"
              title={`${currentModel.provider} / ${currentModel.model}`}
            >
              {currentModel.provider} / {currentModel.model}
            </span>
            <ArrowRight className="text-muted-foreground h-4 w-4 shrink-0" />
          </>
        ) : null}
        <span
          className="truncate"
          title={`${nextModel.provider} / ${nextModel.model}`}
        >
          {nextModel.provider} / {nextModel.model}
        </span>
      </div>
    </ConfirmDialog>
  );
}
