import { type TableViewPresetState } from "@langfuse/shared";
import { Check, Filter, Settings2 } from "lucide-react";

import {
  SESSION_DETAIL_SYSTEM_PRESETS,
  translateSessionDetailPreset,
} from "@/src/features/sessions/session-detail-presets";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemWithSecondaryAction,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export type ModernSessionViewDropdownMenuControls = {
  matchingSystemPresetId: string | undefined;
  matchingSavedViewId: string | undefined;
  savedViews: Array<TableViewPresetState & { id: string; name: string }>;
  onApplyPreset: (
    preset: (typeof SESSION_DETAIL_SYSTEM_PRESETS)[number],
  ) => void;
  onApplySavedView: (
    view: TableViewPresetState & { id: string; name: string },
  ) => void;
  onManageViews: () => void;
  onOpenFilterDialog: () => void;
};

export function ModernSessionViewDropdownMenu({
  controls,
}: {
  controls: ModernSessionViewDropdownMenuControls;
}) {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  return (
    <DropdownMenuContent align="end" className="w-72">
      <DropdownMenuLabel>{tFeatures("ui.systemPresets")}</DropdownMenuLabel>
      {SESSION_DETAIL_SYSTEM_PRESETS.map((preset) =>
        translateSessionDetailPreset(preset, tMore),
      )
        .filter((preset) => preset.filters.length > 0)
        .map((preset) => (
          <DropdownMenuItemWithSecondaryAction
            key={preset.id}
            title={preset.name}
            onClick={() => controls.onApplyPreset(preset)}
            // TODO: We are abusing the `secondaryAction` prop here to show a checkmark for the selected preset. This is not ideal, but it works for now. We should consider adding a `selected` prop to `DropdownMenuItemWithSecondaryAction` in the future.
            secondaryAction={
              controls.matchingSystemPresetId === preset.id
                ? {
                    icon: Check,
                    ariaLabel: tMore("sessions.selectedView", {
                      name: preset.name,
                    }),
                    onClick: () => controls.onApplyPreset(preset),
                  }
                : undefined
            }
          />
        ))}
      <DropdownMenuSeparator />
      <DropdownMenuLabel>{tFeatures("ui.savedViews")}</DropdownMenuLabel>
      {controls.savedViews.map((view) => (
        <DropdownMenuItemWithSecondaryAction
          key={view.id}
          title={view.name}
          onClick={() => controls.onApplySavedView(view)}
          secondaryAction={
            controls.matchingSavedViewId === view.id
              ? {
                  icon: Check,
                  ariaLabel: tMore("sessions.selectedView", {
                    name: view.name,
                  }),
                  onClick: () => controls.onApplySavedView(view),
                }
              : undefined
          }
        />
      ))}
      {controls.savedViews.length === 0 ? (
        <DropdownMenuItem disabled>
          {tFeatures("ui.noSavedViews")}
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuSeparator />
      <DropdownMenuItemWithSecondaryAction
        title={tFeatures("ui.manageViews")}
        icon={Settings2}
        onClick={controls.onManageViews}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItemWithSecondaryAction
        title={tFeatures("ui.applyCustomFilter")}
        icon={Filter}
        onClick={controls.onOpenFilterDialog}
      />
    </DropdownMenuContent>
  );
}
