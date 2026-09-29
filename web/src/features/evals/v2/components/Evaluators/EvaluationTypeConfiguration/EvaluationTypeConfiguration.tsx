import { type ReactNode } from "react";

import { type EvalTemplateType } from "@langfuse/shared";

import { Label } from "@/src/components/ui/label";
import { InfoTooltip } from "@/src/components/ui/InfoTooltip/InfoTooltip";
import { EvaluationTypeToggle } from "./components/EvaluationTypeToggle/EvaluationTypeToggle";
import { useTranslation } from "react-i18next";

/** Shared execution row; its container owns which mode-specific selector follows it. */
export function EvaluationTypeConfiguration({
  mode,
  onModeChange,
  disabled,
  children,
}: {
  mode: EvalTemplateType;
  onModeChange: (mode: EvalTemplateType) => void;
  disabled: boolean;
  children: ReactNode;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-1.5">
        {tFeatures("ui.evaluation")}
        <span className="inline-flex -translate-y-px">
          <InfoTooltip label={tFeatures("ui.aboutEvaluationTypes")}>
            {tFeatures("evalsMore:decision.methodsHelp")}
          </InfoTooltip>
        </span>
      </Label>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>{tFeatures("ui.run")}</span>
        <EvaluationTypeToggle
          value={mode}
          onValueChange={onModeChange}
          disabled={disabled}
        />
        <span>{mode === "CODE" ? "written in" : "with"}</span>
        {children}
      </div>
    </div>
  );
}
