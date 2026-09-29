import {
  Copy,
  ListTree,
  MoreVertical,
  Pencil,
  SquarePercent,
  Trash2,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import { useTranslation } from "react-i18next";

export function EvaluatorActionsCell({
  canViewExecutions,
  onViewScores,
  onViewExecutions,
  onClone,
  onEdit,
  onDelete,
}: {
  canViewExecutions: boolean;
  onViewScores: () => void;
  onViewExecutions: () => void;
  onClone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const capture = usePostHogClientCapture();

  const handlePrimaryAction = () => {
    capture("evaluators:overview_action_click", { action: "view_scores" });
    onViewScores();
  };

  return (
    <div className="flex w-full min-w-0 items-center justify-start gap-1">
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-foreground hover:text-foreground h-auto px-0 py-0"
        onClick={handlePrimaryAction}
      >
        {tFeatures("ui.viewScores")}
        <SquarePercent className="ml-1 h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={tFeatures("ui.evaluatorActions")}
            className="shrink-0"
          >
            <span className="sr-only">
              {tFeatures("evalsMore:actions.openMenu")}
            </span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canViewExecutions ? (
            <DropdownMenuItem onClick={onViewExecutions}>
              <ListTree className="mr-2 h-4 w-4" />
              {tFeatures("ui.viewExecutions")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {tFeatures("ui.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onClone}>
            <Copy className="mr-2 h-4 w-4" />
            {tFeatures("ui.clone")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            {tFeatures("ui.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
