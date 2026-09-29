import { type ColumnDefinition, type FilterState } from "@langfuse/shared";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { InlineFilterBuilder } from "@/src/features/filters";
import { useTranslation } from "react-i18next";

export type ModernSessionFilterDialogViewActions =
  | { type: "none" }
  | {
      type: "create";
      onCreate: (filters: FilterState) => void;
    }
  | {
      type: "update";
      viewName: string;
      isUpdating: boolean;
      onCreate: (filters: FilterState) => void;
      onUpdate: (filters: FilterState) => void;
    };

type ModernSessionFilterDialogContentProps = {
  initialFilters: FilterState;
  filterColumns: ColumnDefinition[];
  filterColumnsWithCustomSelect: string[];
  viewActions: ModernSessionFilterDialogViewActions;
  onCancel: () => void;
  onApplyFilters: (filters: FilterState) => void;
};

export function ModernSessionFilterDialogContent({
  initialFilters,
  filterColumns,
  filterColumnsWithCustomSelect,
  viewActions,
  onCancel,
  onApplyFilters,
}: ModernSessionFilterDialogContentProps) {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const [filters, setFilters] = useState(initialFilters);

  return (
    <DialogContent size="lg">
      <DialogHeader>
        <DialogTitle>{tFeatures("ui.filterObservations")}</DialogTitle>
      </DialogHeader>
      <DialogBody className="overflow-y-auto">
        <InlineFilterBuilder
          columns={filterColumns}
          filterState={filters}
          onChange={setFilters}
          columnsWithCustomSelect={filterColumnsWithCustomSelect}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {tFeatures("ui.cancel")}
        </Button>
        {viewActions.type !== "none" ? (
          <Button
            variant="outline"
            onClick={() => viewActions.onCreate(filters)}
          >
            {tFeatures("ui.saveAsNewView")}
          </Button>
        ) : null}
        {viewActions.type === "update" ? (
          <Button
            variant="outline"
            loading={viewActions.isUpdating}
            onClick={() => viewActions.onUpdate(filters)}
          >
            {tMore("sessions.updateView", { name: viewActions.viewName })}
          </Button>
        ) : null}
        <Button onClick={() => onApplyFilters(filters)}>
          {tFeatures("ui.applyFilters")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
