import { Braces, ListFilter } from "lucide-react";

import { Tabs } from "@/src/components/design-system/Tabs/Tabs";
import type { EvaluatorFilterExperience } from "@/src/features/evals/v2/types/evaluatorFilterExperience";
import { useTranslation } from "react-i18next";

export function FilterModeToggle({
  mode,
  onChange,
}: {
  mode: EvaluatorFilterExperience;
  onChange: (mode: EvaluatorFilterExperience) => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onChange(value as EvaluatorFilterExperience)}
    >
      <Tabs.List aria-label={tFeatures("ui.filterEditorMode")}>
        <Tabs.Trigger
          value="query"
          icon={Braces}
          label={tFeatures("ui.query")}
        />
        <Tabs.Trigger
          value="builder"
          icon={ListFilter}
          label={tFeatures("ui.builder")}
        />
      </Tabs.List>
    </Tabs>
  );
}
