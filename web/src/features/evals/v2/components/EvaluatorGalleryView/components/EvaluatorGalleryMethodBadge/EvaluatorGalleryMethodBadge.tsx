import { useTranslation } from "react-i18next";
import { Code2, Scale, Sparkles } from "lucide-react";
import { EvalTemplateTypeEnum, type EvalTemplateType } from "@langfuse/shared";

const METHOD_BADGES = {
  [EvalTemplateTypeEnum.CODE]: { Icon: Code2, label: "evalsMore:gallery.code" },
  [EvalTemplateTypeEnum.LLM_AS_JUDGE]: {
    Icon: Sparkles,
    label: "evalsMore:gallery.judge",
  },
  [EvalTemplateTypeEnum.DECISION_MODEL]: {
    Icon: Scale,
    label: "evalsMore:gallery.decision",
  },
} as const satisfies Record<EvalTemplateType, { Icon: unknown; label: string }>;

export function EvaluatorGalleryMethodBadge({
  type,
}: {
  type: EvalTemplateType;
}) {
  const { t: tFeatures } = useTranslation("features");
  const { Icon, label } = METHOD_BADGES[type];

  return (
    <span className="bg-muted text-muted-foreground inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-xs leading-none whitespace-nowrap">
      <Icon className="size-3" />
      {tFeatures(label)}
    </span>
  );
}
