/* eslint-disable no-nested-ternary */
import { Badge } from "@/src/components/ui/badge";
import { V4MigrationBadgeContent } from "@/src/features/v4-migration/V4MigrationBadgeContent";
import { useTranslation } from "react-i18next";

export function RuleNameCell({
  name,
  legacy,
  onUpgrade,
}: {
  name: string;
  legacy: boolean;
  onUpgrade?: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="block truncate font-bold" title={name}>
        {name}
      </span>
      {legacy ? (
        onUpgrade ? (
          <span onClick={(event) => event.stopPropagation()}>
            <V4MigrationBadgeContent
              onClick={onUpgrade}
              title={tFeatures("ui.upgradeNow")}
              showChevron={false}
              compact
            />
          </span>
        ) : (
          <Badge variant="warning">{tFeatures("ui.legacy")}</Badge>
        )
      ) : null}
    </div>
  );
}
