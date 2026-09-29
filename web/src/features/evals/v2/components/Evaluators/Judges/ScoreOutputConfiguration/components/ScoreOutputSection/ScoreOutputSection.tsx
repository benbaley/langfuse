import { localizeEvaluatorValidation } from "@/src/features/evals/v2/fns/localizeEvaluatorValidation";
/* eslint-disable no-nested-ternary */
import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Plus, TriangleAlert } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/utils/tailwind";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectTriggerClassName,
} from "@/src/components/ui/select";
import { InfoTooltip } from "@/src/components/ui/InfoTooltip/InfoTooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { ScoreDataTypeEnum } from "@langfuse/shared";
import { CategoryEditorPopover } from "./components/CategoryEditorPopover/CategoryEditorPopover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { getScoreOutputValidation } from "@/src/features/evals/v2/fns/scoreOutput/getScoreOutputValidation";

import {
  type ScoreOutputChoice,
  type ScoreOutputDataType,
  type ScoreOutputSelectorState,
} from "@/src/features/evals/v2/scoreOutputTypes";
import { Trans, useTranslation } from "react-i18next";

// Two empty rows — the minimum a categorical score needs, ready for labels.
const DEFAULT_CHOICES: ScoreOutputChoice[] = [{ label: "" }, { label: "" }];
const DEFAULT_MIN_VALUE = "0";
const DEFAULT_MAX_VALUE = "1";

/** A section label with its helper copy tucked into a hover tooltip instead
    of a permanent paragraph — keeps the label row compact. */
function LabelWithTooltip({
  htmlFor,
  label,
  tooltip,
  children,
}: {
  htmlFor?: string;
  label: string;
  tooltip: ReactNode | null;
  children: ReactNode;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      {children}
      {tooltip ? (
        <InfoTooltip label={tFeatures("evalsMore:score.about", { label })}>
          {tooltip}
        </InfoTooltip>
      ) : null}
    </Label>
  );
}

export type ScoreOutputConstraints = {
  dataTypes?: ScoreOutputDataType[];
  allowMultipleMatches?: boolean;
};

export function ScoreOutputSection({
  state,
  onChange,
  readOnly = false,
  constraints,
}: {
  state: ScoreOutputSelectorState;
  onChange: (next: ScoreOutputSelectorState) => void;
  readOnly?: boolean;
  constraints?: ScoreOutputConstraints;
}) {
  const { t: tFeatures } = useTranslation("features");
  const DATA_TYPE_OPTIONS: { value: ScoreOutputDataType; label: string }[] = [
    {
      value: ScoreDataTypeEnum.NUMERIC,
      label: tFeatures("evalsMore:score.number"),
    },
    {
      value: ScoreDataTypeEnum.CATEGORICAL,
      label: tFeatures("evalsMore:score.category"),
    },
    {
      value: ScoreDataTypeEnum.BOOLEAN,
      label: tFeatures("evalsMore:score.boolean"),
    },
  ];
  const boundsId = useId();
  const dataTypeOptions = constraints?.dataTypes
    ? DATA_TYPE_OPTIONS.filter((option) =>
        constraints.dataTypes?.includes(option.value),
      )
    : DATA_TYPE_OPTIONS;
  const allowMultipleMatches = constraints?.allowMultipleMatches ?? true;
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editingChoiceIndex, setEditingChoiceIndex] = useState<number | null>(
    null,
  );
  const [newChoice, setNewChoice] = useState<ScoreOutputChoice>({ label: "" });
  const categoryWarnings = getScoreOutputValidation(state).categoryWarnings.map(
    (message) =>
      message ? localizeEvaluatorValidation(tFeatures, message) : null,
  );

  const handleDataTypeChange = (dataType: ScoreOutputDataType) => {
    onChange({
      ...state,
      dataType,
      shouldAllowMultipleMatches:
        dataType === ScoreDataTypeEnum.CATEGORICAL
          ? state.shouldAllowMultipleMatches
          : false,
      choices:
        dataType === ScoreDataTypeEnum.CATEGORICAL && state.choices.length === 0
          ? DEFAULT_CHOICES
          : state.choices,
      minValue:
        dataType === ScoreDataTypeEnum.NUMERIC && !state.minValue.trim()
          ? DEFAULT_MIN_VALUE
          : state.minValue,
      maxValue:
        dataType === ScoreDataTypeEnum.NUMERIC && !state.maxValue.trim()
          ? DEFAULT_MAX_VALUE
          : state.maxValue,
    });
  };

  const updateChoice = (index: number, next: Partial<ScoreOutputChoice>) => {
    const choices = [...state.choices];
    choices[index] = { ...choices[index], ...next };
    onChange({ ...state, choices });
  };

  const handleAddCategoryOpenChange = (open: boolean) => {
    if (open) setNewChoice({ label: "" });
    setAddCategoryOpen(open);
  };

  const addChoice = () => {
    onChange({
      ...state,
      choices: [...state.choices, newChoice],
    });
  };

  const minimum = state.minValue.trim();
  const maximum = state.maxValue.trim();
  const numericBoundsLabel =
    minimum && maximum
      ? tFeatures("evalsMore:score.between", { minimum, maximum })
      : minimum
        ? tFeatures("evalsMore:score.atLeast", { minimum })
        : maximum
          ? tFeatures("evalsMore:score.atMost", { maximum })
          : tFeatures("evalsMore:score.unbounded");

  return (
    <div className="flex flex-col gap-2">
      <LabelWithTooltip
        label={tFeatures("evalsMore:score.output")}
        tooltip={readOnly ? null : tFeatures("evalsMore:score.outputHelp")}
      >
        {tFeatures("ui.scoreOutput")}
      </LabelWithTooltip>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Trans
          t={tFeatures}
          i18nKey={
            state.dataType === ScoreDataTypeEnum.NUMERIC
              ? "evalsMore:score.returnNumeric"
              : state.dataType === ScoreDataTypeEnum.CATEGORICAL
                ? "evalsMore:score.returnCategory"
                : "evalsMore:score.returnBoolean"
          }
          components={{
            quantity: (
              <>
                {state.dataType === ScoreDataTypeEnum.CATEGORICAL &&
                allowMultipleMatches ? (
                  <Select
                    value={
                      state.shouldAllowMultipleMatches ? "multiple" : "one"
                    }
                    disabled={readOnly}
                    onValueChange={(value) =>
                      onChange({
                        ...state,
                        shouldAllowMultipleMatches: value === "multiple",
                      })
                    }
                  >
                    <SelectTrigger
                      className="w-auto min-w-24"
                      aria-label={tFeatures("ui.numberOfCategories")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one">
                        {tFeatures("evalsMore:score.one")}
                      </SelectItem>
                      <SelectItem value="multiple">
                        {tFeatures("evalsMore:score.multiple")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>
                    {allowMultipleMatches
                      ? tFeatures("evalsMore:score.a")
                      : tFeatures("evalsMore:score.one")}
                  </span>
                )}
              </>
            ),
            kind: (
              <Select
                value={state.dataType}
                disabled={readOnly || dataTypeOptions.length < 2}
                onValueChange={(value) =>
                  handleDataTypeChange(value as ScoreOutputDataType)
                }
              >
                <SelectTrigger
                  className="w-auto min-w-24"
                  aria-label={tFeatures("evalsMore:score.type")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value === ScoreDataTypeEnum.CATEGORICAL &&
                      state.shouldAllowMultipleMatches
                        ? tFeatures("evalsMore:score.categories")
                        : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
            bounds: (
              <>
                {state.dataType === ScoreDataTypeEnum.NUMERIC && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(selectTriggerClassName, "w-auto")}
                          disabled={readOnly}
                        >
                          {numericBoundsLabel}
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-72">
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className="text-sm font-bold">
                              {tFeatures("ui.numberLimits")}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {tFeatures(
                                "ui.setTheMinimumAndMaximumValuesForTheScore",
                              )}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor={`${boundsId}-minimum`}>
                                {tFeatures("ui.minimum")}
                              </Label>
                              <Input
                                id={`${boundsId}-minimum`}
                                type="number"
                                value={state.minValue}
                                onChange={(e) =>
                                  onChange({
                                    ...state,
                                    minValue: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor={`${boundsId}-maximum`}>
                                {tFeatures("ui.maximum")}
                              </Label>
                              <Input
                                id={`${boundsId}-maximum`}
                                type="number"
                                value={state.maxValue}
                                onChange={(e) =>
                                  onChange({
                                    ...state,
                                    maxValue: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </>
            ),
            choices: (
              <>
                {state.dataType === ScoreDataTypeEnum.CATEGORICAL && (
                  <>
                    {state.choices.map((choice, index) => (
                      <CategoryEditorPopover
                        key={index}
                        title={tFeatures("ui.editCategory")}
                        idSuffix={String(index)}
                        choice={choice}
                        open={editingChoiceIndex === index}
                        onOpenChange={(open) =>
                          setEditingChoiceIndex(open ? index : null)
                        }
                        onChange={(next) => updateChoice(index, next)}
                        onDelete={() => {
                          onChange({
                            ...state,
                            choices: state.choices.filter(
                              (_, i) => i !== index,
                            ),
                          });
                          setEditingChoiceIndex(null);
                        }}
                        onDone={() => setEditingChoiceIndex(null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(selectTriggerClassName, "w-auto")}
                            disabled={readOnly}
                          >
                            <span>
                              {choice.label.trim() ||
                                tFeatures("evalsMore:score.categoryNumber", {
                                  number: index + 1,
                                })}
                            </span>
                            {categoryWarnings[index] ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="text-dark-yellow h-4 w-4 shrink-0"
                                    aria-label={tFeatures(
                                      "evalsMore:score.warning",
                                      { message: categoryWarnings[index] },
                                    )}
                                  >
                                    <TriangleAlert
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {categoryWarnings[index]}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                            {!readOnly ? (
                              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                            ) : null}
                          </Button>
                        </PopoverTrigger>
                      </CategoryEditorPopover>
                    ))}
                    {!readOnly ? (
                      <CategoryEditorPopover
                        title={tFeatures("ui.addCategory")}
                        idSuffix="new"
                        choice={newChoice}
                        onChange={(next) =>
                          setNewChoice((current) => ({ ...current, ...next }))
                        }
                        onDelete={null}
                        onDone={() => {
                          addChoice();
                          setAddCategoryOpen(false);
                        }}
                        open={addCategoryOpen}
                        onOpenChange={handleAddCategoryOpenChange}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={tFeatures("ui.addCategory")}
                            title={tFeatures("ui.addCategory")}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </CategoryEditorPopover>
                    ) : null}
                  </>
                )}
              </>
            ),
            trueValue: (
              <span className="bg-muted/50 text-foreground inline-flex h-8 items-center rounded-md border px-3 opacity-50">
                true
              </span>
            ),
            falseValue: (
              <span className="bg-muted/50 text-foreground inline-flex h-8 items-center rounded-md border px-3 opacity-50">
                false
              </span>
            ),
          }}
        />
      </div>
    </div>
  );
}
