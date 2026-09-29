import type { TFunction } from "i18next";
import { DecisionModelQuestionType } from "@langfuse/shared";
import { Gauge, ListChecks, ToggleLeft, type LucideIcon } from "lucide-react";

import { cn } from "@/src/utils/tailwind";
import { useTranslation } from "react-i18next";

export const getQuestionTypeCopy = (
  tFeatures: TFunction,
): Record<
  DecisionModelQuestionType,
  {
    label: string;
    icon: LucideIcon;
    summary: string;
    writes: string;
    example: string;
    whenToUse: string;
  }
> => ({
  [DecisionModelQuestionType.CHOICE]: {
    label: tFeatures("evalsMore:decision.choice"),
    icon: ListChecks,
    summary: tFeatures("evalsMore:decision.choiceSummary"),
    writes: tFeatures("evalsMore:decision.choiceWrites"),
    example: tFeatures("evalsMore:decision.choiceExample"),
    whenToUse: tFeatures("evalsMore:decision.choiceWhen"),
  },
  [DecisionModelQuestionType.SCORE]: {
    label: tFeatures("evalsMore:decision.score"),
    icon: Gauge,
    summary: tFeatures("evalsMore:decision.scoreSummary"),
    writes: tFeatures("evalsMore:decision.scoreWrites"),
    example: tFeatures("evalsMore:decision.scoreExample"),
    whenToUse: tFeatures("evalsMore:decision.scoreWhen"),
  },
  [DecisionModelQuestionType.NOUL]: {
    label: tFeatures("evalsMore:decision.yesNo"),
    icon: ToggleLeft,
    summary: tFeatures("evalsMore:decision.yesNoSummary"),
    writes: tFeatures("evalsMore:decision.yesNoWrites"),
    example: tFeatures("evalsMore:decision.yesNoExample"),
    whenToUse: tFeatures("evalsMore:decision.yesNoWhen"),
  },
});

const ORDER: DecisionModelQuestionType[] = [
  DecisionModelQuestionType.CHOICE,
  DecisionModelQuestionType.SCORE,
  DecisionModelQuestionType.NOUL,
];

/**
 * Picks the question type. All three primitives stay visible with their
 * descriptor so the model's vocabulary is learned where it is used.
 */
export function QuestionTypeSelector({
  value,
  onValueChange,
  disabled = false,
}: {
  value: DecisionModelQuestionType;
  onValueChange: (value: DecisionModelQuestionType) => void;
  disabled?: boolean;
}) {
  const { t: tFeatures } = useTranslation("features");
  const active = getQuestionTypeCopy(tFeatures)[value];
  return (
    <div className="@container flex flex-col gap-1.5">
      <div
        role="radiogroup"
        aria-label={tFeatures("ui.questionType")}
        className="grid gap-2 @lg:grid-cols-3"
      >
        {ORDER.map((type) => {
          const copy = getQuestionTypeCopy(tFeatures)[type];
          const selected = type === value;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onValueChange(type)}
              className={cn(
                "flex flex-col gap-1 rounded-md border p-3 text-left text-sm transition-colors",
                "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-hidden",
                selected
                  ? "border-primary-accent bg-primary-accent/5 ring-primary-accent ring-1"
                  : "border-border",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <copy.icon className="h-4 w-4 shrink-0" />
                {copy.label}
              </span>
              <span className="text-muted-foreground">{copy.summary}</span>
              <span className="text-muted-foreground text-xs italic">
                {tFeatures("evalsMore:decision.example", {
                  example: copy.example,
                })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        {tFeatures("evalsMore:decision.writesDescription", {
          output: active.writes,
          guidance: active.whenToUse,
        })}
      </p>
    </div>
  );
}
