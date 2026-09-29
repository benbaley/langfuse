import { Scale, X } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";

export function EvaluatorGalleryDecisionModelBanner({
  onTry,
  onDismiss,
}: {
  onTry: () => void;
  onDismiss: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <div className="border-primary-accent/30 bg-primary-accent/5 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-sm">
      <Scale
        className="text-primary-accent h-4 w-4 shrink-0"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <span className="font-bold">
          {tFeatures("ui.newDecisionModelEvaluators")}
        </span>{" "}
        <span className="text-muted-foreground">
          {tFeatures("evalsMore:gallery.decisionHelp")}
        </span>
      </div>
      <Button type="button" size="sm" onClick={onTry}>
        {tFeatures("ui.tryADecisionModel")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={tFeatures("ui.dismiss")}
        onClick={onDismiss}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
