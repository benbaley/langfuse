import { localizeEvaluatorValidation } from "@/src/features/evals/v2/fns/localizeEvaluatorValidation";
import type { TFunction } from "i18next";
import { useId } from "react";
import { DecisionModelQuestionType } from "@langfuse/shared";
import { Trash2 } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { InfoTooltip } from "@/src/components/ui/InfoTooltip/InfoTooltip";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { CollapsibleCard } from "@/src/features/evals/v2/components/CollapsibleCard/CollapsibleCard";
import { ChoiceOptionsEditor } from "@/src/features/evals/v2/components/Evaluators/DecisionModel/ChoiceOptionsEditor/ChoiceOptionsEditor";
import { NoulCriteriaEditor } from "@/src/features/evals/v2/components/Evaluators/DecisionModel/NoulCriteriaEditor/NoulCriteriaEditor";
import { QuestionInstructionsField } from "@/src/features/evals/v2/components/Evaluators/DecisionModel/QuestionInstructionsField/QuestionInstructionsField";
import {
  getQuestionTypeCopy,
  QuestionTypeSelector,
} from "@/src/features/evals/v2/components/Evaluators/DecisionModel/QuestionTypeSelector/QuestionTypeSelector";
import { ScoreLevelsEditor } from "@/src/features/evals/v2/components/Evaluators/DecisionModel/ScoreLevelsEditor/ScoreLevelsEditor";
import {
  suggestScoreName,
  type DecisionModelQuestionDraft,
  type DecisionModelQuestionDraftErrors,
} from "@/src/features/evals/v2/types/decisionModel";
import { cn } from "@/src/utils/tailwind";
import { useTranslation } from "react-i18next";

export type DecisionModelQuestionCardProps = {
  question: DecisionModelQuestionDraft;
  index: number;
  stateKeys: string[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChange: (question: DecisionModelQuestionDraft) => void;
  onRemove: (() => void) | null;
  errors?: DecisionModelQuestionDraftErrors;
};

function writesLine(
  question: DecisionModelQuestionDraft,
  tFeatures: TFunction,
) {
  switch (question.type) {
    case DecisionModelQuestionType.CHOICE:
      return tFeatures("evalsMore:decision.writesChoice", {
        total: question.options.length,
      });
    case DecisionModelQuestionType.SCORE:
      return tFeatures("evalsMore:decision.writesScore", {
        maximum: Math.max(question.levels.length - 1, 0),
      });
    case DecisionModelQuestionType.NOUL:
      return tFeatures("evalsMore:decision.writesProbability");
  }
}

function CriteriaEditor({
  question,
  errors,
  onChange,
}: {
  question: DecisionModelQuestionDraft;
  errors: DecisionModelQuestionDraftErrors;
  onChange: (question: DecisionModelQuestionDraft) => void;
}) {
  switch (question.type) {
    case DecisionModelQuestionType.CHOICE:
      return (
        <ChoiceOptionsEditor
          options={question.options}
          onChange={(options) => onChange({ ...question, options })}
          error={errors.options}
        />
      );
    case DecisionModelQuestionType.SCORE:
      return (
        <ScoreLevelsEditor
          levels={question.levels}
          onChange={(levels) => onChange({ ...question, levels })}
          error={errors.levels}
        />
      );
    case DecisionModelQuestionType.NOUL:
      return (
        <NoulCriteriaEditor
          criteria={question.criteria}
          onChange={(criteria) => onChange({ ...question, criteria })}
        />
      );
  }
}

/**
 * One question of a decision-model evaluator. Collapses to a one-line summary
 * so a long list stays scannable; expanded it walks type → question →
 * criteria → score name, top to bottom.
 */
export function DecisionModelQuestionCard({
  question,
  index,
  stateKeys,
  expanded,
  onExpandedChange,
  onChange,
  onRemove,
  errors: rawErrors = {},
}: DecisionModelQuestionCardProps) {
  const { t: tFeatures } = useTranslation("features");
  const errors = Object.fromEntries(
    Object.entries(rawErrors).map(([key, message]) => [
      key,
      localizeEvaluatorValidation(tFeatures, message),
    ]),
  );
  const id = useId();
  const copy = getQuestionTypeCopy(tFeatures)[question.type];
  const hasErrors = Object.values(errors).some(Boolean);
  const summary =
    question.instructions.trim() || tFeatures("evalsMore:decision.untitled");

  return (
    <CollapsibleCard
      open={expanded}
      onOpenChange={onExpandedChange}
      disabled={false}
      triggerTitle={
        expanded
          ? tFeatures("evalsMore:decision.collapse")
          : tFeatures("evalsMore:decision.expand")
      }
      header={
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground shrink-0 font-mono text-xs">
            {index + 1}
          </span>
          <copy.icon className="h-4 w-4 shrink-0" aria-label={copy.label} />
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 font-mono",
              !question.scoreName.trim() && "text-dark-yellow",
            )}
          >
            {question.scoreName.trim() ||
              tFeatures("evalsMore:decision.nameMissing")}
          </Badge>
          <span
            className={cn(
              "truncate",
              !question.instructions.trim() && "text-muted-foreground italic",
            )}
            title={summary}
          >
            {summary}
          </span>
          {hasErrors ? (
            <Badge variant="destructive" className="shrink-0">
              {tFeatures("ui.needsAttention")}
            </Badge>
          ) : null}
        </span>
      }
      actions={
        <span className="flex shrink-0 items-center pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="hover:text-destructive"
            disabled={!onRemove}
            onClick={onRemove ?? undefined}
            title={
              onRemove
                ? tFeatures("ui.removeQuestion")
                : tFeatures("ui.atLeastOneQuestionIsRequired")
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </span>
      }
    >
      <div className="flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5">
            {tFeatures("ui.type")}
            <InfoTooltip label={tFeatures("ui.aboutQuestionTypes")}>
              {tFeatures("evalsMore:decision.typesHelp")}
            </InfoTooltip>
          </Label>
          <QuestionTypeSelector
            value={question.type}
            onValueChange={(type) => onChange({ ...question, type })}
          />
        </div>

        <QuestionInstructionsField
          value={question.instructions}
          onChange={(instructions) =>
            onChange({
              ...question,
              instructions,
              scoreName:
                question.scoreName === "" ||
                question.scoreName === suggestScoreName(question.instructions)
                  ? suggestScoreName(instructions)
                  : question.scoreName,
            })
          }
          stateKeys={stateKeys}
          placeholder={copy.example}
          error={errors.instructions}
        />

        <CriteriaEditor
          question={question}
          errors={errors}
          onChange={onChange}
        />

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${id}-score-name`}
            className="flex items-center gap-1.5"
          >
            {tFeatures("ui.scoreNameTitle")}
            <InfoTooltip label={tFeatures("ui.aboutScoreNames")}>
              {tFeatures("evalsMore:decision.scoreNamesHelp")}
            </InfoTooltip>
          </Label>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              id={`${id}-score-name`}
              value={question.scoreName}
              onChange={(event) =>
                onChange({ ...question, scoreName: event.target.value })
              }
              placeholder={tFeatures("evalsMore:decision.scoreNameExample")}
              aria-invalid={Boolean(errors.scoreName)}
              className={cn(
                "max-w-xs font-mono",
                errors.scoreName && "border-destructive",
              )}
            />
            <span className="text-muted-foreground text-xs">
              {writesLine(question, tFeatures)}
            </span>
          </div>
          {errors.scoreName ? (
            <p className="text-destructive text-xs">{errors.scoreName}</p>
          ) : null}
        </div>
      </div>
    </CollapsibleCard>
  );
}
