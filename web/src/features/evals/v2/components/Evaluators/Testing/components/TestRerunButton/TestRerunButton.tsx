import { Play } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";

export function TestRerunButton({
  isPending,
  disabledReason,
  onRerun,
}: {
  isPending: boolean;
  disabledReason: string | null;
  onRerun: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={isPending}
      disabled={disabledReason !== null}
      title={disabledReason ?? tFeatures("ui.runTheTestAgain")}
      onClick={onRerun}
    >
      <Play className="mr-1.5 h-3.5 w-3.5" />
      {tFeatures("ui.runAgain")}
    </Button>
  );
}
