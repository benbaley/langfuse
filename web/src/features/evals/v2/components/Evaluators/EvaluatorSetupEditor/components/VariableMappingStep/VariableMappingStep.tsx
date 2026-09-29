import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { Stepper } from "@/src/features/evals/v2/components/Stepper/Stepper";

const COPY = {
  variables: {
    title: "evalsMore:mapping.variables.title",
    description: "evalsMore:mapping.variables.description",
  },
  state: {
    title: "evalsMore:mapping.state.title",
    description: "evalsMore:mapping.state.description",
  },
} as const;

export function VariableMappingStep({
  open,
  onOpenChange,
  mappingEditor,
  variant = "variables",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappingEditor: ReactNode;
  /** Prompt variables of an LLM judge, or the state of a decision model. */
  variant?: keyof typeof COPY;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Stepper
      number={2}
      title={tFeatures(COPY[variant].title)}
      description={tFeatures(COPY[variant].description)}
      open={open}
      onOpenChange={onOpenChange}
    >
      {mappingEditor}
    </Stepper>
  );
}
