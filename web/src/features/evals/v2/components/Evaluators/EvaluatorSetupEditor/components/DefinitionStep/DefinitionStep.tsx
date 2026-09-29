import type { EvalTemplateType } from "@langfuse/shared";
import type { ReactNode } from "react";

import { EvaluationTypeConfiguration } from "@/src/features/evals/v2/components/Evaluators/EvaluationTypeConfiguration/EvaluationTypeConfiguration";
import { Stepper } from "@/src/features/evals/v2/components/Stepper/Stepper";
import { useTranslation } from "react-i18next";

type DefinitionStepProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeChange: (type: EvalTemplateType) => void;
  isEditing: boolean;
} & DefinitionStepContent;

type DefinitionStepContent =
  | {
      type: "LLM_AS_JUDGE";
      typeConfiguration: ReactNode;
      promptEditor: ReactNode;
      scoreOutputEditor: ReactNode;
    }
  | {
      type: "CODE";
      typeConfiguration: ReactNode;
      codeEditor: ReactNode;
    }
  | {
      type: "DECISION_MODEL";
      typeConfiguration: ReactNode;
      questionsEditor: ReactNode;
    };

function DefinitionStepBody(props: DefinitionStepContent) {
  switch (props.type) {
    case "LLM_AS_JUDGE":
      return (
        <>
          {props.promptEditor}
          {props.scoreOutputEditor}
        </>
      );
    case "CODE":
      return props.codeEditor;
    case "DECISION_MODEL":
      return props.questionsEditor;
  }
}

export function DefinitionStep(props: DefinitionStepProps) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Stepper
      number={1}
      title={tFeatures("ui.defineEvaluation")}
      description={tFeatures("evalsMore:definition.description")}
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <EvaluationTypeConfiguration
        mode={props.type}
        onModeChange={props.onTypeChange}
        disabled={props.isEditing}
      >
        {props.typeConfiguration}
      </EvaluationTypeConfiguration>
      <DefinitionStepBody {...props} />
    </Stepper>
  );
}
