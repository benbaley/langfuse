/* eslint-disable @repo/no-margin-on-root-elements */
import { useTranslation } from "react-i18next";
import { type MultiSelect } from "@/src/components/table/data-table-toolbar";
import { Button } from "@/src/components/ui/button";

export function DataTableSelectAllBanner({
  selectAll,
  setSelectAll,
  setRowSelection,
  pageSize,
  totalCount,
  approximateCount,
}: MultiSelect) {
  const { t, i18n } = useTranslation("common");
  const formatCount = (count: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(count);
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : null;
  // Hide the precise number when the row count is not the affected-entity count.
  const exactCount = approximateCount ? null : totalCount;

  return (
    <div className="bg-light-blue/40 dark:bg-light-blue/50 @container mb-2 flex flex-wrap items-center justify-center gap-2 rounded-sm p-2">
      {selectAll ? (
        <span className="text-sm">
          {exactCount === null
            ? t("allMatchingSelected")
            : t("allItemsSelected", {
                total: formatCount(exactCount),
              })}{" "}
          <Button
            variant="ghost"
            className="text-accent-dark-blue hover:text-accent-dark-blue/80 h-auto p-0 font-bold"
            onClick={() => {
              setSelectAll(false);
              setRowSelection({});
            }}
          >
            {t("clearSelection")}
          </Button>
        </span>
      ) : (
        <span className="text-sm">
          {t("pageItemsSelected", {
            total: formatCount(pageSize),
          })}{" "}
          <Button
            variant="ghost"
            className="text-accent-dark-blue hover:text-accent-dark-blue/80 h-auto p-0 font-bold"
            onClick={() => {
              setSelectAll(true);
            }}
          >
            {exactCount === null || totalPages === null
              ? t("selectMatching")
              : t("selectAllPages", {
                  total: formatCount(exactCount),
                  pages: formatCount(totalPages),
                })}
          </Button>
        </span>
      )}
    </div>
  );
}
