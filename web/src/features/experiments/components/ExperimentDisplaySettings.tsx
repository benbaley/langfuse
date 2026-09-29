/* eslint-disable @repo/no-abstracted-overlay-trigger */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Settings2, Check } from "lucide-react";
import {
  type ExperimentDiffMode,
  type ExperimentResultsLayout,
} from "@/src/features/experiments/hooks/useExperimentResultsState";
import { useTranslation } from "react-i18next";

type ExperimentDisplaySettingsProps = {
  layout: ExperimentResultsLayout;
  onLayoutChange: (layout: ExperimentResultsLayout) => void;
  diffMode: ExperimentDiffMode;
  onDiffModeChange: (diffMode: ExperimentDiffMode) => void;
  itemVisibility: "baseline-only" | "all";
  onItemVisibilityChange: (visibility: "baseline-only" | "all") => void;
  hasComparisons: boolean;
  hasBaseline: boolean;
};

/** A menu row that reads as a radio option. */
const OptionItem = ({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) => (
  <DropdownMenuItem onClick={onSelect} disabled={disabled}>
    {selected ? (
      <Check className="mr-2 h-4 w-4 shrink-0" />
    ) : (
      <span className="mr-2 h-4 w-4 shrink-0" />
    )}
    {children}
  </DropdownMenuItem>
);

/**
 * The shape of the comparison, as one menu: which layout, what each cell's
 * second line is measured against, and whether items missing from the baseline
 * are listed.
 *
 * These settings live in the URL and travel with a shared link.
 */
export function ExperimentDisplaySettings({
  layout,
  onLayoutChange,
  diffMode,
  onDiffModeChange,
  itemVisibility,
  onItemVisibilityChange,
  hasComparisons,
  hasBaseline,
}: ExperimentDisplaySettingsProps) {
  const { t: tFeatures } = useTranslation("features");
  const isItemVisibilityDisabled = !hasComparisons || !hasBaseline;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings2 className="h-4 w-4" />
          <span className="ml-2 hidden md:inline">
            {tFeatures("ui.display")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{tFeatures("ui.layout")}</DropdownMenuLabel>
        <OptionItem
          selected={layout === "list"}
          onSelect={() => onLayoutChange("list")}
        >
          {tFeatures("ui.diffOneRowPerItem")}
        </OptionItem>
        <OptionItem
          selected={layout === "grid"}
          onSelect={() => onLayoutChange("grid")}
        >
          {tFeatures("ui.sideBySideAColumnPerExperiment")}
        </OptionItem>
        <OptionItem
          selected={layout === "matrix"}
          onSelect={() => onLayoutChange("matrix")}
        >
          {tFeatures("ui.scoreMatrixScoresAsRowsRunsAsColumns")}
        </OptionItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>{tFeatures("ui.diff")}</DropdownMenuLabel>
        <OptionItem
          selected={diffMode === "comparison"}
          onSelect={() => onDiffModeChange("comparison")}
        >
          {tFeatures("ui.comparisonBaseline")}
        </OptionItem>
        <OptionItem
          selected={diffMode === "expected"}
          onSelect={() => onDiffModeChange("expected")}
        >
          {tFeatures("ui.expectedOutputTitleText")}
        </OptionItem>
        <OptionItem
          selected={diffMode === "off"}
          onSelect={() => onDiffModeChange("off")}
        >
          {tFeatures("ui.offValuesOnly")}
        </OptionItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>{tFeatures("ui.itemVisibility")}</DropdownMenuLabel>
        <OptionItem
          selected={itemVisibility === "baseline-only"}
          disabled={isItemVisibilityDisabled}
          onSelect={() => onItemVisibilityChange("baseline-only")}
        >
          {tFeatures("ui.showOnlyItemsInBaseline")}
        </OptionItem>
        <OptionItem
          selected={itemVisibility === "all"}
          disabled={isItemVisibilityDisabled}
          onSelect={() => onItemVisibilityChange("all")}
        >
          {tFeatures("ui.showAllItems")}
        </OptionItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
