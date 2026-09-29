/* eslint-disable no-nested-ternary */
import { Trans, useTranslation } from "react-i18next";
import { showErrorToast, showSuccessToast } from "@/src/features/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2, Webhook, X } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { ActionButton } from "@/src/components/ActionButton";
import { ConfirmationDialogController } from "@/src/components/design-system/ConfirmationDialogController/ConfirmationDialogController";
import { createStatusTableColumn } from "@/src/components/design-system/table/columns/createStatusTableColumn";
import { createTextTableColumn } from "@/src/components/design-system/table/columns/createTextTableColumn";
import { SimpleDataTable } from "@/src/components/table/simple-data-table";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { useHasProjectAccess } from "@/src/features/rbac";
import {
  WEB_CALLOUT_BLOCKED_HEADER_NAMES,
  WEB_CALLOUT_HEADER_NAME_PATTERN,
} from "@/src/features/web-callouts/headerRules";
import { api, type RouterOutputs } from "@/src/utils/api";

type WebCalloutEndpoint = RouterOutputs["webCallouts"]["all"][number];

const webCalloutFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(100),
    url: z.url(),
    enabled: z.boolean(),
    toastMessage: z.string().trim().min(1).max(200),
    headers: z.array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const seenHeaderNames = new Set<string>();

    data.headers.forEach((header, index) => {
      const name = header.name.trim();

      if (!name) {
        return;
      }

      const lowerName = name.toLowerCase();

      if (!WEB_CALLOUT_HEADER_NAME_PATTERN.test(name)) {
        ctx.addIssue({
          code: "custom",
          message: "settingsMore:validation.headerInvalid",
          path: ["headers", index, "name"],
        });
      }

      if (WEB_CALLOUT_BLOCKED_HEADER_NAMES.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "settingsMore:validation.headerProtected",
          path: ["headers", index, "name"],
        });
      }

      if (seenHeaderNames.has(lowerName)) {
        ctx.addIssue({
          code: "custom",
          message: "settingsMore:validation.headerUnique",
          path: ["headers", index, "name"],
        });
      }

      seenHeaderNames.add(lowerName);
    });
  });

type WebCalloutFormValues = z.infer<typeof webCalloutFormSchema>;

export function WebCalloutSettingsPage(props: { projectId: string }) {
  const { t } = useTranslation("settingsMore");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] =
    useState<WebCalloutEndpoint | null>(null);

  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "integrations:CRUD",
  });

  const endpoints = api.webCallouts.all.useQuery(
    { projectId: props.projectId },
    { enabled: hasAccess },
  );

  const configuredEndpoint = endpoints.data?.[0];
  const canCreateEndpoint = !configuredEndpoint;
  const addEndpointDisabledReason = endpoints.isLoading
    ? t("callout.loading")
    : endpoints.isError
      ? t("callout.loadFailed")
      : !canCreateEndpoint
        ? t("callout.limit")
        : undefined;

  const openCreateDialog = () => {
    setEditingEndpoint(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((endpoint: WebCalloutEndpoint) => {
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  }, []);

  const columns = useMemo<LangfuseColumnDef<WebCalloutEndpoint>[]>(
    () => [
      createTextTableColumn<WebCalloutEndpoint>({
        accessorKey: "name",
        header: t("common.name"),
      }),
      {
        accessorKey: "url",
        header: t("callout.endpoint"),
        size: 576,
        cell: ({ getValue }) => {
          const url = getValue<string>();
          return (
            <span className="font-mono break-all" title={url}>
              {url}
            </span>
          );
        },
      },
      {
        accessorKey: "toastMessage",
        header: t("callout.toast"),
        cell: ({ row }) => <ToastMessageCell endpoint={row.original} />,
      },
      {
        accessorKey: "requestHeaderKeys",
        header: t("webhook.headers"),
        cell: ({ row }) => <HeaderList endpoint={row.original} />,
      },
      createStatusTableColumn<WebCalloutEndpoint, boolean>({
        accessorKey: "enabled",
        header: t("common.status"),
        getStatus: (enabled) => (enabled ? "active" : "disabled"),
      }),
      {
        accessorKey: "id",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(row.original)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("callout.edit")}</TooltipContent>
            </Tooltip>
            <DeleteEndpointDialogController
              projectId={props.projectId}
              endpoint={row.original}
            >
              {({ openDialog }) => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={openDialog}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("callout.delete")}</TooltipContent>
                </Tooltip>
              )}
            </DeleteEndpointDialogController>
          </div>
        ),
      },
    ],
    [openEditDialog, props.projectId, t],
  );

  if (!hasAccess) {
    return (
      <div>
        <Alert>
          <Alert.Title>{t("common.accessDenied")}</Alert.Title>
          <Alert.Description>{t("callout.accessDenied")}</Alert.Description>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <p className="text-primary mb-4 text-sm">
        <Trans
          t={t}
          i18nKey="callout.fullDescription"
          components={{
            link: (
              <a
                href="https://langfuse.com/docs/observability/features/web-callouts"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              />
            ),
          }}
        />
      </p>

      <div className="mb-4 flex justify-end">
        <WebCalloutEndpointDialog
          projectId={props.projectId}
          endpoint={editingEndpoint}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingEndpoint(null);
            }
          }}
          trigger={
            <AddEndpointButton
              disabledReason={addEndpointDisabledReason}
              onClick={openCreateDialog}
            />
          }
        />
      </div>

      <Card className="overflow-auto">
        <SimpleDataTable
          columns={columns}
          data={endpoints.data ?? []}
          isLoading={endpoints.isLoading}
          noResults={
            endpoints.isError ? (
              <span className="text-destructive">{t("callout.loadRetry")}</span>
            ) : (
              <span className="text-muted-foreground">
                {t("callout.empty")}
              </span>
            )
          }
        />
      </Card>
    </div>
  );
}

function AddEndpointButton(props: {
  disabledReason?: string;
  onClick: () => void;
}) {
  const { t } = useTranslation("settingsMore");
  const button = (
    <Button
      disabled={Boolean(props.disabledReason)}
      className={props.disabledReason ? "pointer-events-none" : undefined}
      onClick={props.onClick}
    >
      <Plus className="mr-1 h-4 w-4" />

      {t("callout.add")}
    </Button>
  );

  if (!props.disabledReason) {
    return <DialogTrigger asChild>{button}</DialogTrigger>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{button}</span>
      </TooltipTrigger>
      <TooltipContent>{props.disabledReason}</TooltipContent>
    </Tooltip>
  );
}

function HeaderList(props: { endpoint: WebCalloutEndpoint }) {
  const { t } = useTranslation("settingsMore");
  const headers = props.endpoint.requestHeaderKeys;

  if (headers.length === 0) {
    return <span className="text-muted-foreground">{t("common.none")}</span>;
  }

  return (
    <span className="font-mono text-sm break-words">{headers.join(", ")}</span>
  );
}

function ToastMessageCell(props: { endpoint: WebCalloutEndpoint }) {
  return (
    <div
      className="max-w-xs truncate text-sm"
      title={props.endpoint.toastMessage}
    >
      {props.endpoint.toastMessage}
    </div>
  );
}

function WebCalloutEndpointDialog(props: {
  projectId: string;
  endpoint: WebCalloutEndpoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
}) {
  const { t } = useTranslation("settingsMore");
  const utils = api.useUtils();
  const upsertMutation = api.webCallouts.upsert.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: props.endpoint ? t("callout.updated") : t("callout.created"),
        description: t("callout.saved"),
      });
      props.onOpenChange(false);
    },
    onError: (error) => {
      showErrorToast(t("callout.saveFailed"), error.message);
    },
  });

  const form = useForm<WebCalloutFormValues>({
    resolver: zodResolver(webCalloutFormSchema),
    defaultValues: endpointToFormValues(props.endpoint),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  useEffect(() => {
    if (props.open) {
      form.reset(endpointToFormValues(props.endpoint));
    }
  }, [form, props.endpoint, props.open]);

  const onSubmit = (values: WebCalloutFormValues) => {
    upsertMutation.mutate({
      projectId: props.projectId,
      id: values.id,
      name: values.name,
      url: values.url,
      enabled: values.enabled,
      toastMessage: values.toastMessage,
      requestHeaders: formValuesToRequestHeaders(values),
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.trigger}
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {props.endpoint ? t("callout.editTitle") : t("callout.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("callout.formHint")}{" "}
            <a
              href="https://langfuse.com/docs/observability/features/web-callouts"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              {t("callout.docs")}
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <DialogBody className="min-h-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("blob.endpoint")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/langfuse/callout"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("callout.endpointHint")}
                    </FormDescription>
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

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>{t("common.enabled")}</FormLabel>
                      <FormDescription>
                        {t("callout.enabledHint")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toastMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("callout.toastLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>{t("callout.toastHint")}</FormDescription>
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

              <div>
                <FormLabel>{t("webhook.headers")}</FormLabel>
                <FormDescription className="mb-2">
                  {t("callout.headersHint")}
                </FormDescription>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const currentHeaderName = form.watch(
                      `headers.${index}.name`,
                    );
                    const preservesExistingValue = hasExistingHeaderName(
                      props.endpoint,
                      currentHeaderName,
                    );

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={`headers.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={t("llm.headerName")}
                                  {...field}
                                />
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
                        <FormField
                          control={form.control}
                          name={`headers.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder={
                                    preservesExistingValue
                                      ? "***"
                                      : t("llm.headerValue")
                                  }
                                  type="password"
                                  {...field}
                                />
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("callout.removeHeader")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() =>
                    append({
                      name: "",
                      value: "",
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />

                  {t("callout.addHeader")}
                </Button>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => props.onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={upsertMutation.isPending}>
                {t("callout.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteEndpointDialogController(props: {
  projectId: string;
  endpoint: WebCalloutEndpoint;
  children: (control: { openDialog: () => void }) => ReactNode;
}) {
  const { t } = useTranslation("settingsMore");
  const utils = api.useUtils();
  const deleteMutation = api.webCallouts.delete.useMutation({
    onSuccess: async () => {
      await utils.webCallouts.invalidate();
      showSuccessToast({
        title: t("callout.deleted"),
        description: t("callout.deletedHint"),
      });
    },
    onError: (error) => {
      showErrorToast(t("callout.deleteFailed"), error.message);
    },
  });

  return (
    <ConfirmationDialogController
      title={t("callout.deleteTitle")}
      text={t("callout.deleteHint")}
      confirmLabel={t("callout.delete")}
      variant="destructive"
      loading={deleteMutation.isPending}
      onConfirm={() =>
        deleteMutation.mutateAsync({
          projectId: props.projectId,
          id: props.endpoint.id,
        })
      }
    >
      {props.children}
    </ConfirmationDialogController>
  );
}

const endpointToFormValues = (
  endpoint: WebCalloutEndpoint | null,
): WebCalloutFormValues => ({
  id: endpoint?.id,
  name: endpoint?.name ?? "Default",
  url: endpoint?.url ?? "",
  enabled: endpoint?.enabled ?? true,
  toastMessage: endpoint?.toastMessage ?? "Callout sent",
  headers: (endpoint?.requestHeaderKeys ?? []).map((name: string) => ({
    name,
    value: "",
  })),
});

const formValuesToRequestHeaders = (
  values: WebCalloutFormValues,
): Record<string, string> =>
  Object.fromEntries(
    values.headers
      .filter((header) => header.name.trim())
      .map((header) => [header.name.trim(), header.value.trim()]),
  );

const hasExistingHeaderName = (
  endpoint: WebCalloutEndpoint | null,
  name: string,
) => {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName) {
    return false;
  }

  return (
    endpoint?.requestHeaderKeys.some(
      (headerName: string) => headerName.toLowerCase() === normalizedName,
    ) ?? false
  );
};

export function WebCalloutIntegrationCard(props: {
  projectId: string;
  hasAccess: boolean;
}) {
  const { t } = useTranslation("settingsMore");
  return (
    <Card className="p-3">
      <div className="mb-4 flex items-center gap-2">
        <Webhook className="text-foreground h-5 w-5" />
        <span className="font-bold">{t("callout.title")}</span>
      </div>
      <p className="text-primary mb-4 text-sm">{t("callout.description")}</p>
      <ActionButton
        variant="secondary"
        hasAccess={props.hasAccess}
        href={`/project/${props.projectId}/settings/integrations/web-callouts`}
      >
        {t("common.configure")}
      </ActionButton>
    </Card>
  );
}
