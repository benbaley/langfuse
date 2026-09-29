/* eslint-disable @repo/no-abstracted-overlay-trigger */
import { Trans, useTranslation } from "react-i18next";
import { showErrorToast, showSuccessToast } from "@/src/features/notifications";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { ConfirmationDialogController } from "@/src/components/design-system/ConfirmationDialogController/ConfirmationDialogController";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { SimpleDataTable } from "@/src/components/table/simple-data-table";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { createTextTableColumn } from "@/src/components/design-system/table/columns/createTextTableColumn";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import Header from "@/src/components/layouts/header";
import { useHasEntitlement } from "@/src/features/entitlements";
import { useHasOrganizationAccess } from "@/src/features/rbac";
import { api } from "@/src/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Row } from "@tanstack/react-table";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCopyToClipboard } from "@/src/hooks/useCopyToClipboard";

const addDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3, "settingsMore:validation.domainLength")
    .max(253, "settingsMore:validation.domainLength")
    .transform((v) => v.toLowerCase())
    .refine(
      (v) =>
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
          v,
        ),
      { message: "settingsMore:validation.domainInvalid" },
    ),
});

type AddDomainInput = z.infer<typeof addDomainSchema>;

export const VerifiedDomainsSettings = ({ orgId }: { orgId: string }) => {
  const { t } = useTranslation("settingsMore");
  const hasEntitlement = useHasEntitlement("cloud-multi-tenant-sso");
  const hasAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "organization:update",
  });

  const heading = (
    <>
      <Header title={t("domains.title")} />
      <p className="text-muted-foreground mb-4 text-sm">
        {t("domains.description")}
      </p>
    </>
  );

  if (!hasEntitlement) {
    return (
      <div>
        {heading}
        <Alert icon={AlertCircle}>
          <Alert.Title>{t("common.notAvailable")}</Alert.Title>
          <Alert.Description>{t("domains.planUnavailable")}</Alert.Description>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div>
        {heading}
        <Alert>
          <Alert.Title>{t("common.accessDenied")}</Alert.Title>
          <Alert.Description>{t("domains.accessDenied")}</Alert.Description>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title={t("domains.title")}
        actionButtons={<AddDomainButton orgId={orgId} />}
      />
      <p className="text-muted-foreground text-sm">
        {t("domains.description")}
      </p>
      <DomainsTable orgId={orgId} />
    </div>
  );
};

function DomainsTable({ orgId }: { orgId: string }) {
  const { t, i18n } = useTranslation("settingsMore");
  const query = api.verifiedDomain.list.useQuery({ orgId });
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

  const columns = useMemo<LangfuseColumnDef<DomainRowData>[]>(
    () => [
      {
        accessorKey: "domain",
        header: t("common.domain"),
        cell: ({ row }) =>
          !row.original.verifiedAt ? (
            <button
              type="button"
              onClick={() =>
                setCollapsedRows((current) => {
                  const next = new Set(current);
                  if (next.has(row.original.id)) next.delete(row.original.id);
                  else next.add(row.original.id);
                  return next;
                })
              }
              className="flex items-center gap-1"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform ${
                  collapsedRows.has(row.original.id) ? "" : "rotate-90"
                }`}
              />
              {row.original.domain}
            </button>
          ) : (
            row.original.domain
          ),
      },
      {
        accessorKey: "verifiedAt",
        header: t("common.status"),
        cell: ({ row }) =>
          row.original.verifiedAt ? (
            <Badge variant="default">{t("domains.verified")}</Badge>
          ) : (
            <Badge variant="secondary">{t("domains.pending")}</Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: t("common.added"),
        hideBelowMd: true,
        cell: ({ row }) =>
          row.original.createdAt.toLocaleDateString(i18n.language),
      },
      {
        accessorKey: "id",
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <DomainActions orgId={orgId} row={row.original} />
          </div>
        ),
      },
    ],
    [collapsedRows, orgId, t, i18n.language],
  );

  const renderDetailRow = (row: Row<DomainRowData>) =>
    !row.original.verifiedAt && !collapsedRows.has(row.original.id) ? (
      <tr className="bg-muted/30 hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
        <td
          colSpan={4}
          className="h-full border-b px-2 py-4 align-middle [&:has([role=checkbox])]:pr-0 [:last-child_>_&]:border-b-0"
        >
          <DnsInstructions
            recordHost={row.original.recordHost}
            recordValue={row.original.recordValue}
          />
        </td>
      </tr>
    ) : null;

  return (
    <Card className="mb-4 overflow-hidden">
      <SimpleDataTable
        columns={columns}
        data={query.data ?? []}
        isLoading={query.isLoading}
        noResults={
          query.isError ? (
            <div className="text-destructive py-10 text-sm">
              {t("domains.loadFailed")}
            </div>
          ) : (
            <div className="py-10 text-sm">{t("domains.empty")}</div>
          )
        }
        bodyTone="muted"
        rowVariant="primary-hover"
        renderDetailRow={renderDetailRow}
      />
    </Card>
  );
}

type DomainRowData = {
  id: string;
  domain: string;
  verifiedAt: Date | null;
  createdAt: Date;
  recordHost: string;
  recordValue: string;
};

function DomainActions({ orgId, row }: { orgId: string; row: DomainRowData }) {
  const { t } = useTranslation("settingsMore");
  const utils = api.useUtils();

  const verifyMutation = api.verifiedDomain.verify.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      utils.ssoConfig.get.invalidate({ orgId });
      showSuccessToast({
        title: t("domains.verifiedTitle"),
        description: t("domains.verifiedHint", { domain: row.domain }),
      });
    },
    onError: (err) => {
      showErrorToast(t("domains.verifyFailed"), err.message);
    },
  });

  return (
    <>
      {!row.verifiedAt && (
        <Button
          size="sm"
          onClick={() => verifyMutation.mutate({ orgId, id: row.id })}
          loading={verifyMutation.isPending}
        >
          {t("domains.verify")}
        </Button>
      )}
      <DeleteDomainButton
        orgId={orgId}
        id={row.id}
        domain={row.domain}
        verified={Boolean(row.verifiedAt)}
      />
    </>
  );
}

function DnsInstructions({
  recordHost,
  recordValue,
}: {
  recordHost: string;
  recordValue: string;
}) {
  const { t } = useTranslation("settingsMore");
  const columns: LangfuseColumnDef<{
    type: string;
    host: string;
    value: string;
  }>[] = [
    createTextTableColumn({
      accessorKey: "type",
      header: t("common.type"),
      size: 64,
    }),
    {
      accessorKey: "host",
      header: t("common.host"),
      size: 216,
      cell: ({ getValue }) => <CopyableText value={getValue<string>()} />,
    },
    {
      accessorKey: "value",
      header: t("common.value"),
      cell: ({ getValue }) => <CopyableText value={getValue<string>()} />,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">{t("domains.dnsRecord")}</p>
      <Card className="overflow-hidden">
        <SimpleDataTable
          columns={columns}
          data={[{ type: "TXT", host: recordHost, value: recordValue }]}
          isLoading={false}
          noResults={null}
        />
      </Card>
      <p className="text-muted-foreground text-xs">
        <Trans
          t={t}
          i18nKey="domains.dnsHint"
          components={{ verify: <span className="font-bold" /> }}
        />
      </p>
    </div>
  );
}

function CopyableText({ value }: { value: string }) {
  const { t } = useTranslation("settingsMore");
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <div className="relative min-w-0 pr-8 font-mono break-all">
      <span title={value}>{value}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-2 -translate-y-1/2"
        title={t("common.copy")}
        aria-label={t("common.copy")}
        onClick={async (event) => {
          event.preventDefault();
          const button = event.currentTarget;
          await copy(value).catch(() => undefined);
          button.focus();
        }}
      >
        {isCopied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

function AddDomainButton({ orgId }: { orgId: string }) {
  const { t } = useTranslation("settingsMore");
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<AddDomainInput>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: { domain: "" },
  });

  const createMutation = api.verifiedDomain.create.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      showSuccessToast({
        title: t("domains.added"),
        description: t("domains.addedHint"),
      });
      form.reset();
      setOpen(false);
    },
    onError: (err) => {
      form.setError("domain", { message: err.message });
    },
  });

  function onSubmit(values: AddDomainInput) {
    createMutation.mutate({ orgId, domain: values.domain });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("domains.addButton")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("domains.addTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.domain")}</FormLabel>
                    <FormControl>
                      <Input placeholder="acme.com" autoFocus {...field} />
                    </FormControl>
                    <FormMessage
                      translateError={(message) =>
                        typeof message === "string" &&
                        message.startsWith("settingsMore:")
                          ? t(message.slice("settingsMore:".length))
                          : undefined
                      }
                    />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t("common.add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDomainButton({
  orgId,
  id,
  domain,
  verified,
}: {
  orgId: string;
  id: string;
  domain: string;
  verified: boolean;
}) {
  const { t } = useTranslation("settingsMore");
  const utils = api.useUtils();

  const deleteMutation = api.verifiedDomain.delete.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      showSuccessToast({
        title: t("domains.removed"),
        description: t("domains.removedHint", { domain }),
      });
    },
    onError: (err) => {
      showErrorToast(t("domains.removeFailed"), err.message);
    },
  });

  return (
    <ConfirmationDialogController
      title={t("domains.removeTitle", { domain })}
      text={verified ? t("domains.removeVerified") : t("domains.removePending")}
      confirmLabel={t("common.remove")}
      variant="destructive"
      loading={deleteMutation.isPending}
      onConfirm={async () => {
        await deleteMutation.mutateAsync({ orgId, id });
      }}
    >
      {({ openDialog }) => (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t("domains.deleteLabel", { domain })}
          onClick={openDialog}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      )}
    </ConfirmationDialogController>
  );
}
