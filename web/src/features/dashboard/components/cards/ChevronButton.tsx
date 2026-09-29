import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";

export const ExpandListButton = ({
  isExpanded,
  setExpanded,
  expandText = "See more",
}: {
  isExpanded: boolean;
  setExpanded: (isExpanded: boolean) => void;
  expandText?: string;
}) => {
  const { t: tApp } = useTranslation("app");
  return (
    <Button
      className="mt-2"
      variant="ghost"
      onClick={() => setExpanded(!isExpanded)}
    >
      {isExpanded ? (
        <>
          <ChevronUp className="mr-2 h-4 w-4" /> {tApp("ui.SeeLess")}
        </>
      ) : (
        <>
          <ChevronDown className="mr-2 h-4 w-4" /> {expandText}
        </>
      )}
    </Button>
  );
};
