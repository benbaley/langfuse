import { useTranslation } from "react-i18next";
import { formatDistanceToNowStrict } from "date-fns";
import { zhCN } from "date-fns/locale";

import { EvaluatorTypeBadge } from "@/src/features/evals/v2/components/Evaluators/EvaluatorTypeBadge/EvaluatorTypeBadge";
import type { RuleEvaluatorOption } from "@/src/features/evals/v2/types/rules";

export function EvaluatorPickerOption({
  evaluator,
}: {
  evaluator: RuleEvaluatorOption;
}) {
  const { t: tFeatures, i18n } = useTranslation("features");
  const creator =
    evaluator.createdByUser?.name ??
    evaluator.createdByUser?.email ??
    tFeatures("evalsMore:evaluator.unknown");
  const updated = evaluator.updatedAt
    ? formatDistanceToNowStrict(evaluator.updatedAt, {
        addSuffix: true,
        locale: i18n.resolvedLanguage === "zh-CN" ? zhCN : undefined,
      })
    : null;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate" title={evaluator.name}>
          {evaluator.name}
        </span>
        <EvaluatorTypeBadge type={evaluator.type} />
      </div>
      <div className="text-muted-foreground flex max-w-[45%] min-w-0 shrink-0 items-center justify-end gap-1 text-xs">
        <span
          className="min-w-0 truncate"
          title={tFeatures("evalsMore:rules.creator", { creator })}
        >
          {creator}
        </span>
        {updated ? (
          <>
            <span aria-hidden>·</span>
            <span
              className="shrink-0"
              title={tFeatures("evalsMore:rules.updated", { date: updated })}
            >
              {updated}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
