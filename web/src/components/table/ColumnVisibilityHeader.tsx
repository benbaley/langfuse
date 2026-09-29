import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function ColumnVisibilityHeader({
  onRestoreDefaults,
}: {
  onRestoreDefaults?: () => void;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-popover sticky top-0 z-10 flex h-10 items-center justify-between gap-3 border-b px-3">
      <p className="text-sm font-bold">{t("columns")}</p>
      {onRestoreDefaults && (
        <Button
          variant="outline"
          size="sm"
          className="bg-accent gap-1.5 text-xs"
          onClick={onRestoreDefaults}
        >
          <RotateCcw className="size-3" />
          {t("restoreDefaults")}
        </Button>
      )}
    </div>
  );
}
