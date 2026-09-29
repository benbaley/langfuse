import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/utils/tailwind";
import { useTranslation } from "react-i18next";

export type NoulCriteriaDraft = { true: string; false: string };

/**
 * Optional refinement of a yes/no question. Collapsed by default: most
 * questions are clear without it, and the model returns P(true) either way.
 */
export function NoulCriteriaEditor({
  criteria,
  onChange,
}: {
  criteria: NoulCriteriaDraft;
  onChange: (criteria: NoulCriteriaDraft) => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  const id = useId();
  const hasContent = Boolean(criteria.true.trim() || criteria.false.trim());
  const [open, setOpen] = useState(hasContent);

  return (
    <div className="@container flex flex-col gap-2">
      <Button
        type="button"
        variant="link"
        size="sm"
        className="w-fit pl-0"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {tFeatures("ui.refineWhatYesAndNoMean")}
        <span className="text-muted-foreground ml-1 font-normal">
          {tFeatures("ui.optional")}
        </span>
        <ChevronDown
          className={cn(
            "ml-1 h-4 w-4 transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </Button>
      {open ? (
        <div className="grid gap-3 @md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-true`}>{tFeatures("ui.yesMeans")}</Label>
            <Textarea
              id={`${id}-true`}
              value={criteria.true}
              onChange={(event) =>
                onChange({ ...criteria, true: event.target.value })
              }
              placeholder={tFeatures("evalsMore:decision.yesCriteria")}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-false`}>{tFeatures("ui.noMeans")}</Label>
            <Textarea
              id={`${id}-false`}
              value={criteria.false}
              onChange={(event) =>
                onChange({ ...criteria, false: event.target.value })
              }
              placeholder={tFeatures("evalsMore:decision.noCriteria")}
              rows={3}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
