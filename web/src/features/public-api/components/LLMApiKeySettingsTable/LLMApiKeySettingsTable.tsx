import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { Pencil, PlusIcon, Trash } from "lucide-react";

import { type TableProps } from "@/src/components/design-system/table/Table";
import { createBadgeTableColumn } from "@/src/components/design-system/table/columns/createBadgeTableColumn";
import { createTextTableColumn } from "@/src/components/design-system/table/columns/createTextTableColumn";
import {
  SettingsTable,
  type SettingsTableProps,
} from "@/src/components/SettingsTable/SettingsTable";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { type RouterOutput } from "@/src/utils/types";

export type LLMApiKeySettingsTableRow =
  RouterOutput["llmApiKey"]["all"]["data"][number];

export function LLMApiKeySettingsTable({
  createAction,
  deleteAction,
  updateAction,
  ...tableProps
}: Pick<
  TableProps<LLMApiKeySettingsTableRow>,
  "data" | "loadingRowCount" | "noResultsMessage"
> & {
  createAction: { hasAccess: boolean; onClick: () => void };
  deleteAction: {
    hasAccess: boolean;
    onClick: (apiKey: LLMApiKeySettingsTableRow) => void;
  };
  updateAction: {
    hasAccess: boolean;
    onClick: (apiKey: LLMApiKeySettingsTableRow) => void;
  };
}) {
  const { t } = useTranslation("settings");
  const showExtraHeaderKeys =
    tableProps.data.status === "success" &&
    tableProps.data.data.some((apiKey) => apiKey.extraHeaderKeys.length > 0);

  const columns = useMemo<LangfuseColumnDef<LLMApiKeySettingsTableRow>[]>(
    () => [
      createTextTableColumn<LLMApiKeySettingsTableRow>({
        accessorKey: "provider",
        header: t("provider"),
        enableResizing: false,
      }),
      createBadgeTableColumn<LLMApiKeySettingsTableRow>({
        accessorKey: "adapter",
        header: t("adapter"),
        enableResizing: false,
      }),
      createTextTableColumn<LLMApiKeySettingsTableRow>({
        accessorKey: "baseURL",
        header: t("baseUrl"),
        nullValue: "default",
        enableResizing: false,
      }),
      createTextTableColumn<LLMApiKeySettingsTableRow>({
        accessorKey: "displaySecretKey",
        header: t("apiKey"),
        enableResizing: false,
      }),
      ...(showExtraHeaderKeys
        ? [
            createTextTableColumn<LLMApiKeySettingsTableRow, string[]>({
              accessorKey: "extraHeaderKeys",
              header: t("extraHeaders"),
              mapValue: (value) => value?.join(", "),
              enableResizing: false,
            }),
          ]
        : []),
    ],
    [showExtraHeaderKeys, t],
  );

  const actions = useCallback<
    NonNullable<TableProps<LLMApiKeySettingsTableRow>["actions"]>
  >(
    (apiKey) => [
      {
        id: "edit",
        type: "item",
        title: t("editConnection"),
        icon: Pencil,
        disabled: updateAction.hasAccess
          ? undefined
          : { reason: t("editConnectionForbidden") },
        onClick: () => updateAction.onClick(apiKey),
      },
      {
        id: "delete",
        type: "item",
        title: t("deleteConnection"),
        icon: Trash,
        variant: "destructive",
        disabled: deleteAction.hasAccess
          ? undefined
          : { reason: t("deleteConnectionForbidden") },
        onClick: () => deleteAction.onClick(apiKey),
      },
    ],
    [deleteAction, updateAction, t],
  );

  const toolbarActions: SettingsTableProps<LLMApiKeySettingsTableRow>["toolbarActions"] =
    createAction.hasAccess
      ? [
          {
            id: "add-connection",
            label: t("addLlmConnection"),
            variant: "secondary",
            icon: <PlusIcon className="size-4" aria-hidden="true" />,
            onClick: createAction.onClick,
          },
        ]
      : undefined;

  return (
    <SettingsTable
      tableName={t("llmConnections")}
      columns={columns}
      actions={actions}
      toolbarActions={toolbarActions}
      onRowClick={updateAction.hasAccess ? updateAction.onClick : undefined}
      {...tableProps}
    />
  );
}
