import { useStore } from "zustand";
import { Button } from "@/src/components/ui/button";
import { DialogFooter } from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  type createRuleSetupStore,
  isRuleDraftDirty,
} from "@/src/features/evals/v2/stores/createRuleSetupStore";
import { useTranslation } from "react-i18next";

export function RuleDialogFooter({
  ruleSetupStore,
  mutationPending,
  nameGenerationPending,
  isEditing,
  canEdit,
  nameAIAssistanceAvailable,
  onCancel,
  onSave,
}: {
  ruleSetupStore: ReturnType<typeof createRuleSetupStore>;
  mutationPending: boolean;
  nameGenerationPending: boolean;
  isEditing: boolean;
  canEdit: boolean;
  nameAIAssistanceAvailable: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const name = useStore(ruleSetupStore, (state) => state.name);
  const dirty = useStore(ruleSetupStore, isRuleDraftDirty);
  const nameMissing = !name.trim();
  const saveButton = (
    <Button
      type="button"
      loading={mutationPending || nameGenerationPending}
      loadingText={
        nameGenerationPending
          ? tFeatures("ui.generatingName")
          : tFeatures("evalsMore:rules.validating")
      }
      disabled={
        !canEdit ||
        (isEditing && !dirty) ||
        (nameMissing && !nameAIAssistanceAvailable) ||
        mutationPending ||
        nameGenerationPending
      }
      className={
        nameMissing && !nameAIAssistanceAvailable
          ? "pointer-events-none"
          : undefined
      }
      onClick={onSave}
    >
      {isEditing
        ? tFeatures("ui.saveChanges")
        : tFeatures("ui.saveAndActivate")}
    </Button>
  );

  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        {dirty ? tFeatures("ui.cancel") : tFeatures("ui.close")}
      </Button>
      {nameMissing && !nameAIAssistanceAvailable && canEdit ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-not-allowed">{saveButton}</span>
          </TooltipTrigger>
          <TooltipContent>
            {tFeatures("ui.addARuleNameBeforeSaving")}
          </TooltipContent>
        </Tooltip>
      ) : (
        saveButton
      )}
    </DialogFooter>
  );
}
