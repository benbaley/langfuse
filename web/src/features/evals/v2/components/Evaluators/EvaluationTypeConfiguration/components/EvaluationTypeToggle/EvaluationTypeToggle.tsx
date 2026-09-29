import { Code2, Scale, Sparkles } from "lucide-react";
import { EvalTemplateTypeEnum, type EvalTemplateType } from "@langfuse/shared";

import { Tabs } from "@/src/components/design-system/Tabs/Tabs";
import { useTranslation } from "react-i18next";

/** Selects the evaluator implementation. */
export function EvaluationTypeToggle({
  value,
  onValueChange,
  disabled = false,
}: {
  value: EvalTemplateType;
  onValueChange: (value: EvalTemplateType) => void;
  disabled?: boolean;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Tabs
      value={value}
      onValueChange={(mode) => onValueChange(mode as EvalTemplateType)}
    >
      <Tabs.List variant="outline">
        {!disabled || value === EvalTemplateTypeEnum.LLM_AS_JUDGE ? (
          <Tabs.Trigger
            value={EvalTemplateTypeEnum.LLM_AS_JUDGE}
            disabled={disabled}
            icon={Sparkles}
            label="LLM-as-a-judge"
          />
        ) : null}
        {!disabled || value === EvalTemplateTypeEnum.CODE ? (
          <Tabs.Trigger
            value={EvalTemplateTypeEnum.CODE}
            disabled={disabled}
            icon={Code2}
            label="Code evaluator"
          />
        ) : null}
        {!disabled || value === EvalTemplateTypeEnum.DECISION_MODEL ? (
          <Tabs.Trigger
            value={EvalTemplateTypeEnum.DECISION_MODEL}
            disabled={disabled}
            icon={Scale}
            label={tFeatures("ui.decisionModelExperimental")}
          />
        ) : null}
      </Tabs.List>
    </Tabs>
  );
}
