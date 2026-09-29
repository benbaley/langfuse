import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
} from "@/src/components/ui/collapsible";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { RadioGroup } from "@/src/components/design-system/RadioGroup/RadioGroup";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/utils/tailwind";
import styles from "./EvaluatorSavedDialog.module.css";
import { useTranslation } from "react-i18next";

export type EvaluatorSavedMode = "test-filters" | "different-scope";

export function EvaluatorSavedDialog({
  open,
  mode,
  modeContentByMode,
  backfillContent,
  costSummary,
  canSubmit,
  isSubmitting,
  primaryActionLabel,
  onModeChange,
  onDismiss,
  onSecondaryAction,
  onPrimaryAction,
  onOpenAutoFocus,
  onCloseAnimationEnd,
}: {
  open: boolean;
  mode: EvaluatorSavedMode;
  modeContentByMode: Record<EvaluatorSavedMode, ReactNode>;
  backfillContent: ReactNode;
  costSummary: ReactNode;
  canSubmit: boolean;
  isSubmitting: boolean;
  primaryActionLabel: string;
  onModeChange: (mode: EvaluatorSavedMode) => void;
  onDismiss: () => void;
  onSecondaryAction: () => void;
  onPrimaryAction: () => void;
  onOpenAutoFocus?: () => void;
  onCloseAnimationEnd?: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const modeOptions = [
    {
      value: "test-filters",
      title: tFeatures("evalsMore:saved.reuse"),
      description: tFeatures("evalsMore:saved.reuseDescription"),
    },
    {
      value: "different-scope",
      title: tFeatures("evalsMore:saved.different"),
      description: tFeatures("evalsMore:saved.differentDescription"),
    },
  ] as const;
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismiss();
      }}
    >
      <DialogContent
        className="sm:max-w-4xl"
        closeOnInteractionOutside
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAnimationEnd}
      >
        <DialogHeader className="[&>div]:items-start [&>div>button]:-mt-1">
          <DialogTitle>{tFeatures("evalsMore:saved.title")}</DialogTitle>
          <DialogDescription>
            {tFeatures("ui.chooseWhichObservationsThisEvaluatorShouldScore")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-0 p-0">
          <div className="grid h-[30rem] grid-cols-[minmax(0,1fr)_15rem] overflow-hidden">
            <div className="min-w-0 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable]">
              <h3 className="mb-2 text-sm font-bold">
                {tFeatures("ui.setUpRuleToRunOnIncomingObservations")}
              </h3>
              <RadioGroup
                value={mode}
                onValueChange={(value) =>
                  onModeChange(value as EvaluatorSavedMode)
                }
              >
                {modeOptions.map((option) => {
                  const selected = option.value === mode;
                  const id = `evaluator-saved-mode-${option.value}`;
                  const contentId = `${id}-content`;

                  return (
                    <Collapsible key={option.value} open={selected} asChild>
                      <div
                        className={cn(
                          "min-w-0 rounded-md border p-3 transition-colors duration-200",
                          selected
                            ? "border-foreground bg-background"
                            : "bg-muted/30 hover:bg-muted/50 cursor-pointer",
                        )}
                        onClick={(event) => {
                          if (selected) return;
                          const target = event.target as HTMLElement;
                          if (
                            target.closest(
                              "button, input, label, a, [role='radio']",
                            )
                          ) {
                            return;
                          }
                          onModeChange(option.value);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            <RadioGroup.Item
                              id={id}
                              value={option.value}
                              aria-controls={contentId}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={id}
                              className="block cursor-pointer text-sm leading-none font-bold"
                            >
                              {option.title}
                            </label>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <CollapsibleContent
                          id={contentId}
                          aria-labelledby={id}
                          className={cn(styles.collapsibleContent, "space-y-3")}
                        >
                          <div className="mt-3 ml-6 min-w-0 pr-1">
                            {modeContentByMode[option.value]}
                          </div>
                          {backfillContent}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </RadioGroup>
            </div>
            <aside
              className={cn(
                "overflow-y-auto px-5 py-5 [scrollbar-gutter:stable]",
                costSummary && "border-l",
              )}
            >
              {costSummary}
            </aside>
          </div>
        </DialogBody>
        <DialogFooter className="px-6 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={onSecondaryAction}
              >
                {tFeatures("ui.skipExecution")}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              {tFeatures("evalsMore:saved.skipHelp")}
            </TooltipContent>
          </Tooltip>
          <Button
            disabled={!canSubmit}
            loading={isSubmitting}
            loadingText={tFeatures("ui.startingEvaluator")}
            onClick={onPrimaryAction}
          >
            {primaryActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
