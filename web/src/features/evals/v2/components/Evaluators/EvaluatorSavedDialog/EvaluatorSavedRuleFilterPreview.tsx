import { useTranslation } from "react-i18next";
import type { FilterState } from "@langfuse/shared";
import { AlertTriangle } from "lucide-react";

import { Alert } from "@/src/components/design-system/Alert/Alert";
import { RuleFilterPills } from "@/src/features/evals/v2/components/Rules/RuleFilterPills/RuleFilterPills";

export function EvaluatorSavedRuleFilterPreview({
  filter,
  unsupportedReasons,
}: {
  filter: FilterState;
  unsupportedReasons: ReadonlyMap<number, string>;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <div className="space-y-2">
      {unsupportedReasons.size > 0 ? (
        <Alert variant="warning" size="sm" icon={AlertTriangle}>
          <Alert.Title>{tFeatures("evalsMore:saved.omittedTitle")}</Alert.Title>
          <Alert.Description>
            {tFeatures("evalsMore:saved.omittedDescription", {
              omitted: unsupportedReasons.size,
              total: filter.length,
            })}
          </Alert.Description>
        </Alert>
      ) : null}
      <RuleFilterPills
        filter={filter}
        display="search-bar"
        disabledReasons={unsupportedReasons}
      />
    </div>
  );
}
