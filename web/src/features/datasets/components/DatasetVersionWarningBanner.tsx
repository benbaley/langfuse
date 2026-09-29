/* eslint-disable @repo/no-style-props */
import { Info } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";

type DatasetVersionWarningBannerProps = {
  selectedVersion: Date;
  resetToLatest: () => void;
  className?: string;
  changeCounts?: {
    upserts: number;
    deletes: number;
  };
};

export function DatasetVersionWarningBanner({
  selectedVersion,
  resetToLatest,
  className = "",
  changeCounts,
}: DatasetVersionWarningBannerProps) {
  const { t: tMore, i18n } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const totalChanges = changeCounts
    ? changeCounts.upserts + changeCounts.deletes
    : 0;
  const hasChanges = totalChanges > 0;

  return (
    <div
      className={`border-accent-dark-blue/10 bg-accent-light-blue/30 flex items-start gap-3 border-b p-3 ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm wrap-break-word">
            {tMore("datasets.viewingVersion", {
              time: selectedVersion.toLocaleString(i18n.resolvedLanguage),
            })}
          </p>
          <Button
            onClick={resetToLatest}
            variant="link"
            className="h-auto shrink-0 p-0 text-sm underline-offset-4"
          >
            {tFeatures("ui.returnToLatest")}
          </Button>
        </div>
        {changeCounts && hasChanges && (
          <p className="text-muted-foreground text-xs">
            {tMore("datasets.changesSinceVersion", {
              count: totalChanges,
              upserts: changeCounts.upserts,
              deletes: changeCounts.deletes,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
