import { Braces, Text } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { type IoRenderMode } from "@/src/components/table/data-table-io-render-mode-switch";
import { useTranslation } from "react-i18next";

export const ExperimentFormatSetting = ({
  ioRenderMode,
  onIoRenderModeChange,
}: {
  ioRenderMode: IoRenderMode;
  onIoRenderModeChange: (mode: IoRenderMode) => void;
}) => {
  const { t: tFeatures } = useTranslation("features");
  return (
    <ToggleGroup
      type="single"
      value={ioRenderMode}
      onValueChange={(value) => {
        if (value === "json" || value === "text") onIoRenderModeChange(value);
      }}
      variant="outline"
      aria-label={tFeatures("ui.cellFormat")}
      className="gap-0"
    >
      <ToggleGroupItem
        value="json"
        aria-label="JSON"
        className="h-8 gap-1.5 rounded-r-none px-2.5 text-xs"
      >
        <Braces className="h-3.5 w-3.5" />
        JSON
      </ToggleGroupItem>
      <ToggleGroupItem
        value="text"
        aria-label={tFeatures("ui.formatted")}
        className="h-8 gap-1.5 rounded-l-none border-l-0 px-2.5 text-xs"
      >
        <Text className="h-3.5 w-3.5" />
        {tFeatures("ui.formatted")}
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
