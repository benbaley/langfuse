import { Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { OverviewSelectionBar } from "@/src/features/evals/v2/components/OverviewSelectionBar/OverviewSelectionBar";
import { useTranslation } from "react-i18next";

export function RulesOverviewSelectionBarView({
  selectedCount,
  hasWriteAccess,
  statusChangePending,
  deletePending,
  deleteDialogOpen,
  onClear,
  onEnable,
  onDisable,
  onDelete,
  onDeleteDialogOpenChange,
  onConfirmDelete,
}: {
  selectedCount: number;
  hasWriteAccess: boolean;
  statusChangePending: boolean;
  deletePending: boolean;
  deleteDialogOpen: boolean;
  onClear: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onDelete: () => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <>
      <OverviewSelectionBar selectedCount={selectedCount} onClear={onClear}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasWriteAccess || statusChangePending}
          onClick={onEnable}
        >
          <Play className="mr-2 h-4 w-4" /> {tFeatures("ui.enable")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasWriteAccess || statusChangePending}
          onClick={onDisable}
        >
          <Pause className="mr-2 h-4 w-4" /> {tFeatures("ui.disable")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasWriteAccess}
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" /> {tFeatures("ui.delete")}
        </Button>
      </OverviewSelectionBar>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogOpenChange}
        title={tFeatures("evalsMore:rules.deleteTitle")}
        description={tFeatures("evalsMore:rules.deleteDescription", {
          count: selectedCount,
        })}
        confirmLabel="Delete"
        loading={deletePending}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
