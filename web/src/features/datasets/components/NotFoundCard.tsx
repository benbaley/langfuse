import { Card } from "@/src/components/ui/card";
import { useTranslation } from "react-i18next";

export const NotFoundCard = ({
  itemType,
  singleLine = false,
}: {
  itemType: "trace" | "observation";
  singleLine?: boolean;
}) => {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  if (singleLine) {
    return (
      <Card className="flex h-full w-full items-center justify-start overflow-hidden rounded-sm px-2">
        <p
          className="text-muted-foreground truncate text-xs"
          title={tMore("datasets.processingOrDeleted", {
            type:
              itemType === "trace"
                ? tFeatures("ui.trace")
                : tFeatures("ui.observation"),
          })}
        >
          {tMore("datasets.processingOrDeleted", {
            type:
              itemType === "trace"
                ? tFeatures("ui.trace")
                : tFeatures("ui.observation"),
          })}
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-sm p-3">
      <h2 className="mb-1.5 text-sm font-bold">{tFeatures("ui.notFound")}</h2>
      <p className="text-muted-foreground max-w-xs text-center text-xs">
        {tMore("datasets.processingOrDeleted", {
          type:
            itemType === "trace"
              ? tFeatures("ui.trace")
              : tFeatures("ui.observation"),
        })}
      </p>
    </Card>
  );
};
