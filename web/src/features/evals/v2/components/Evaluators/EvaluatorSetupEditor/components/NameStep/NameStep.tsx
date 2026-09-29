import type { ComponentProps } from "react";

import { AIAssistedInput } from "@/src/components/ui/ai-assisted-input";
import { Label } from "@/src/components/ui/label";
import { InfoTooltip } from "@/src/components/ui/InfoTooltip/InfoTooltip";
import { Stepper } from "@/src/features/evals/v2/components/Stepper/Stepper";
import { useTranslation } from "react-i18next";

const COPY = {
  default: {
    description:
      "Give the evaluator a clear name (it's also used as the score name) and explain when it should be used.",
  },
  decisionModel: {
    description:
      "Give the evaluator a clear name and explain when it should be used.",
  },
} as const;

export function NameStep({
  step,
  variant,
  open,
  onOpenChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  nameAIAssistance,
  descriptionAIAssistance,
}: {
  step: number;
  variant: keyof typeof COPY;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  nameAIAssistance: ComponentProps<typeof AIAssistedInput>["aiAssistance"];
  descriptionAIAssistance: ComponentProps<
    typeof AIAssistedInput
  >["aiAssistance"];
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Stepper
      number={step}
      title={tFeatures("ui.nameEvaluator")}
      description={COPY[variant].description}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="evaluator-name" className="flex items-center gap-1.5">
            {tFeatures("ui.name")}
            {variant === "default" ? (
              <InfoTooltip label={tFeatures("ui.aboutEvaluatorNames")}>
                {tFeatures(
                  "ui.theEvaluatorNameIsAlsoUsedAsTheScoreNameForTheScoresItProduces",
                )}
              </InfoTooltip>
            ) : null}
          </Label>
          <AIAssistedInput
            id="evaluator-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={
              nameAIAssistance.state === "generating"
                ? "Generating a name…"
                : tFeatures("ui.evaluatorName")
            }
            aiAssistance={nameAIAssistance}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="evaluator-description"
            className="flex items-center gap-1"
          >
            {tFeatures("ui.description")}
            <span className="text-muted-foreground font-normal">
              {tFeatures("ui.optional")}
            </span>
          </Label>
          <AIAssistedInput
            id="evaluator-description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={
              descriptionAIAssistance.state === "generating"
                ? tFeatures("ui.generatingADescription")
                : tFeatures("ui.describeWhatThisEvaluatorMeasures")
            }
            fieldName="description"
            aiAssistance={descriptionAIAssistance}
          />
        </div>
      </div>
    </Stepper>
  );
}
