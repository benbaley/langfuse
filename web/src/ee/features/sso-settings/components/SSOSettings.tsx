import { useTranslation } from "react-i18next";
import { showErrorToast, showSuccessToast } from "@/src/features/notifications";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { ConfirmationDialogController } from "@/src/components/design-system/ConfirmationDialogController/ConfirmationDialogController";
import { DialogController } from "@/src/components/design-system/DialogController/DialogController";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/design-system/Checkbox/Checkbox";
import { createTextTableColumn } from "@/src/components/design-system/table/columns/createTextTableColumn";
import { SimpleDataTable } from "@/src/components/table/simple-data-table";
import { type LangfuseColumnDef } from "@/src/components/table/types";
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import Header from "@/src/components/layouts/header";
import { useHasEntitlement } from "@/src/features/entitlements";
import { useHasOrganizationAccess } from "@/src/features/rbac";
import { VerifiedDomainsSettings } from "@/src/ee/features/verified-domains";
import { SsoProviderSchema } from "@/src/ee/features/multi-tenant-sso";
import { api } from "@/src/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, Copy, TrashIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCopyToClipboard } from "@/src/hooks/useCopyToClipboard";

const SSO_VALIDATION_MESSAGES: Record<string, string> = {
  "OIDC issuer urls must be a valid URL": "settingsMore:validation.oidcUrl",
  "OIDC issuer urls must start with https://":
    "settingsMore:validation.oidcHttps",
  "Github Enterprise baseUrls must be a valid URL":
    "settingsMore:validation.githubUrl",
  "Github Enterprise baseUrls must start with https://":
    "settingsMore:validation.githubHttps",
  "Authentik issuer must be in format https://<domain>/application/o/<slug> without trailing slash":
    "settingsMore:validation.authentikIssuer",
  "Azure AD tenantId is required": "settingsMore:validation.azureTenant",
  "Name is required": "settingsMore:validation.nameRequired",
};

const SSO_PROVIDERS: ReadonlyArray<{
  id: SsoProviderSchema["authProvider"];
  label: string;
  fields: ReadonlyArray<"issuer" | "tenantId" | "baseUrl" | "name">;
}> = [
  { id: "google", label: "Google", fields: [] },
  { id: "github", label: "GitHub", fields: [] },
  { id: "github-enterprise", label: "GitHub Enterprise", fields: ["baseUrl"] },
  { id: "gitlab", label: "GitLab", fields: [] },
  { id: "auth0", label: "Auth0", fields: ["issuer"] },
  { id: "okta", label: "Okta", fields: ["issuer"] },
  { id: "authentik", label: "Authentik", fields: ["issuer"] },
  { id: "onelogin", label: "OneLogin", fields: ["issuer"] },
  { id: "azure-ad", label: "Azure AD / Entra ID", fields: ["tenantId"] },
  { id: "cognito", label: "AWS Cognito", fields: ["issuer"] },
  { id: "keycloak", label: "Keycloak", fields: ["issuer"] },
  { id: "jumpcloud", label: "JumpCloud", fields: ["issuer"] },
  // Custom OIDC requires a display name on the schema; surface it in the form.
  { id: "custom", label: "Custom OIDC", fields: ["name", "issuer"] },
];

const providerLabel = (id: string) =>
  SSO_PROVIDERS.find((p) => p.id === id)?.label ?? id;

// Loose form schema; the strict validation lives in SsoProviderSchema and runs
// at submit time. Keeping the form schema permissive lets users mid-edit a
// field without immediate noise from required-field errors on every render.
const formSchema = z.object({
  authProvider: z.enum(SSO_PROVIDERS.map((p) => p.id) as [string, ...string[]]),
  authConfig: z.object({
    clientId: z.string().min(1, "settingsMore:validation.required"),
    clientSecret: z.string().min(1, "settingsMore:validation.required"),
    issuer: z.string().optional(),
    tenantId: z.string().optional(),
    baseUrl: z.string().optional(),
    // Required by CustomProviderSchema; optional in the form so other
    // providers don't carry a stray field. The strict provider schema
    // enforces presence at submit for `custom`.
    name: z.string().optional(),
    idToken: z.boolean().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

type AuthConfigFormField = `authConfig.${
  | "clientId"
  | "clientSecret"
  | "issuer"
  | "tenantId"
  | "baseUrl"
  | "name"
  | "idToken"}`;

type SsoConfigRow = {
  domain: string;
  authProvider: string;
  authConfig: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

type SsoConfigTableRow = {
  domain: string;
  config: SsoConfigRow | null;
};

export const SSOSettings = ({ orgId }: { orgId: string }) => {
  const { t } = useTranslation("settingsMore");
  const hasEntitlement = useHasEntitlement("cloud-multi-tenant-sso");
  const hasAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "organization:update",
  });

  const heading = (
    <>
      <Header title={t("sso.title")} />
      <p className="text-muted-foreground mb-4 text-sm">
        {t("sso.description")}
      </p>
    </>
  );

  if (!hasEntitlement) {
    return (
      <div className="space-y-8">
        <VerifiedDomainsSettings orgId={orgId} />
        <div>
          {heading}
          <Alert icon={AlertCircle}>
            <Alert.Title>{t("common.notAvailable")}</Alert.Title>
            <Alert.Description>{t("sso.planUnavailable")}</Alert.Description>
          </Alert>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <VerifiedDomainsSettings orgId={orgId} />
        <div>
          {heading}
          <Alert>
            <Alert.Title>{t("common.accessDenied")}</Alert.Title>
            <Alert.Description>{t("sso.accessDenied")}</Alert.Description>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <VerifiedDomainsSettings orgId={orgId} />
      <div className="space-y-6">
        {heading}
        <SsoConfigsTable orgId={orgId} />
      </div>
    </div>
  );
};

function SsoConfigsTable({ orgId }: { orgId: string }) {
  const { t, i18n } = useTranslation("settingsMore");
  const verifiedDomainsQuery = api.verifiedDomain.list.useQuery({ orgId });
  const ssoConfigsQuery = api.ssoConfig.get.useQuery({ orgId });

  const verifiedDomains = useMemo(
    () =>
      verifiedDomainsQuery.data?.filter(
        (domain: { verifiedAt: Date | null }) => domain.verifiedAt != null,
      ) ?? [],
    [verifiedDomainsQuery.data],
  );
  const configByDomain = useMemo(() => {
    const map = new Map<string, SsoConfigRow>();
    ssoConfigsQuery.data?.forEach((config: SsoConfigRow) =>
      map.set(config.domain, config),
    );
    return map;
  }, [ssoConfigsQuery.data]);

  const data: SsoConfigTableRow[] = verifiedDomains.map(
    (domain: { domain: string }) => ({
      domain: domain.domain,
      config: configByDomain.get(domain.domain) ?? null,
    }),
  );

  if (verifiedDomains.length === 0) {
    return (
      <Card className="overflow-hidden">
        <p className="text-muted-foreground px-6 py-12 text-center text-sm">
          {t("sso.verifyDomain")}
        </p>
      </Card>
    );
  }

  return (
    <SsoConfigDialogController orgId={orgId}>
      {({ openDialog: openConfigDialog }) => (
        <DeleteSsoConfigDialogController orgId={orgId}>
          {({ openDialog: openDeleteDialog }) => {
            const columns: LangfuseColumnDef<SsoConfigTableRow>[] = [
              createTextTableColumn<SsoConfigTableRow>({
                accessorKey: "domain",
                header: t("common.domain"),
              }),
              {
                accessorKey: "config",
                header: t("common.provider"),
                cell: ({ row }) =>
                  row.original.config ? (
                    <Badge variant="default">
                      {row.original.config.authProvider === "custom"
                        ? t("sso.customOidc")
                        : providerLabel(row.original.config.authProvider)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("sso.notConfigured")}</Badge>
                  ),
              },
              {
                accessorKey: "config",
                id: "updatedAt",
                header: t("common.updated"),
                hideBelowMd: true,
                cell: ({ row }) =>
                  row.original.config
                    ? row.original.config.updatedAt.toLocaleDateString(
                        i18n.language,
                      )
                    : "—",
              },
              {
                accessorKey: "domain",
                id: "actions",
                header: "",
                cell: ({ row }) => (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant={row.original.config ? "outline" : "default"}
                      onClick={() => openConfigDialog(row.original)}
                    >
                      {row.original.config
                        ? t("common.update")
                        : t("sso.configure")}
                    </Button>
                    {row.original.config ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t("sso.deleteLabel", {
                          domain: row.original.domain,
                        })}
                        onClick={() => openDeleteDialog(row.original.domain)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ];

            return (
              <Card className="mb-4 overflow-hidden">
                <SimpleDataTable
                  columns={columns}
                  data={data}
                  isLoading={false}
                  noResults={null}
                  bodyTone="muted"
                  rowVariant="primary-hover"
                />
              </Card>
            );
          }}
        </DeleteSsoConfigDialogController>
      )}
    </SsoConfigDialogController>
  );
}

function SsoConfigDialogController({
  orgId,
  children,
}: {
  orgId: string;
  children: (control: {
    openDialog: (config: SsoConfigTableRow) => void;
  }) => React.ReactNode;
}) {
  return (
    <DialogController<SsoConfigTableRow>
      renderDialog={({ state, closeDialog }) => (
        <DialogContent className="sm:max-w-xl">
          <SsoConfigDialogContent
            key={state.domain}
            orgId={orgId}
            domain={state.domain}
            existing={state.config}
            closeDialog={closeDialog}
          />
        </DialogContent>
      )}
    >
      {({ openDialog }) => children({ openDialog })}
    </DialogController>
  );
}

function SsoConfigDialogContent({
  orgId,
  domain,
  existing,
  closeDialog,
}: {
  orgId: string;
  domain: string;
  existing: SsoConfigRow | null;
  closeDialog: () => void;
}) {
  const { t } = useTranslation("settingsMore");
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const utils = api.useUtils();

  const defaultValues = useMemo<FormValues>(() => {
    const cfg = (existing?.authConfig ?? {}) as Record<string, unknown>;
    const enterprise = cfg.enterprise as { baseUrl?: string } | undefined;
    return {
      authProvider:
        existing?.authProvider ?? ("okta" as SsoProviderSchema["authProvider"]),
      authConfig: {
        clientId: typeof cfg.clientId === "string" ? cfg.clientId : "",
        clientSecret: "",
        issuer: typeof cfg.issuer === "string" ? cfg.issuer : "",
        tenantId: typeof cfg.tenantId === "string" ? cfg.tenantId : "",
        baseUrl: enterprise?.baseUrl ?? "",
        name: typeof cfg.name === "string" ? cfg.name : "",
        idToken: typeof cfg.idToken === "boolean" ? cfg.idToken : true,
      },
    };
  }, [existing]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const selectedProvider = form.watch("authProvider");
  const providerSpec = useMemo(
    () =>
      SSO_PROVIDERS.find((p) => p.id === selectedProvider) ?? SSO_PROVIDERS[0],
    [selectedProvider],
  );

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/auth/callback/${domain}.${selectedProvider}`;
  }, [domain, selectedProvider]);

  const saveMutation = api.ssoConfig.save.useMutation({
    onSuccess: () => {
      utils.ssoConfig.get.invalidate({ orgId });
      showSuccessToast({
        title: existing ? t("sso.updated") : t("sso.configured"),
        description: t("sso.activeSoon", { domain }),
      });
      closeDialog();
      setPendingValues(null);
      form.reset();
    },
    onError: (err) => {
      showErrorToast(
        existing ? t("sso.updateFailed") : t("sso.configurationFailed"),
        err.message,
      );
    },
  });

  async function handleConfirm() {
    if (!pendingValues) return;
    const payload = buildSsoPayload(domain, pendingValues);
    const parsed = SsoProviderSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const schemaPath = firstIssue.path.join(".");
      // `buildSsoPayload` re-nests `baseUrl` under `enterprise` for
      // github-enterprise; the strict schema reports errors at the nested
      // path, but the form field is registered flat. Map back so
      // `setError` lands on a watched field and the inline message renders.
      const formPath =
        schemaPath === "authConfig.enterprise.baseUrl"
          ? "authConfig.baseUrl"
          : schemaPath;
      const formField = formPath.startsWith("authConfig.")
        ? (formPath as AuthConfigFormField)
        : "authProvider";
      form.setError(formField, {
        message:
          SSO_VALIDATION_MESSAGES[firstIssue.message] ?? firstIssue.message,
      });
      // Defensive fallback: if a future schema path doesn't map cleanly to
      // a registered form field, surface a toast so the user is never left
      // with a silently-closing dialog and no feedback.
      const FORM_FIELDS = [
        "authProvider",
        "authConfig.clientId",
        "authConfig.clientSecret",
        "authConfig.issuer",
        "authConfig.tenantId",
        "authConfig.baseUrl",
        "authConfig.name",
        "authConfig.idToken",
      ];
      if (!FORM_FIELDS.includes(formField)) {
        showErrorToast(
          existing ? t("sso.updateFailed") : t("sso.configurationFailed"),
          firstIssue.message,
        );
      }
      return;
    }
    await saveMutation.mutateAsync({ orgId, payload: parsed.data });
  }

  return (
    <ConfirmationDialogController
      title={
        existing
          ? t("sso.replaceTitle", { domain })
          : t("sso.activateTitle", { domain })
      }
      text={t(existing ? "sso.replaceWarning" : "sso.activateWarning", {
        domain,
      })}
      confirmLabel={existing ? t("sso.replace") : t("sso.activate")}
      variant="default"
      loading={saveMutation.isPending}
      onConfirm={handleConfirm}
    >
      {({ openDialog }) => (
        <>
          <DialogHeader>
            <DialogTitle>
              {existing
                ? t("sso.updateTitle", { domain })
                : t("sso.configureTitle", { domain })}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                setPendingValues(values);
                openDialog();
              })}
            >
              <DialogBody className="space-y-4">
                <FormField
                  control={form.control}
                  name="authProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.provider")}</FormLabel>
                      <FormControl>
                        <SelectInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={t("sso.selectProvider")}
                          options={SSO_PROVIDERS.map((provider) => ({
                            value: provider.id,
                            label:
                              provider.id === "custom"
                                ? t("sso.customOidc")
                                : provider.label,
                          }))}
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

                <CallbackUrlPanel callbackUrl={callbackUrl} />

                {providerSpec.fields.includes("name") ? (
                  <FormField
                    control={form.control}
                    name="authConfig.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sso.displayName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme SSO" {...field} />
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
                ) : null}

                <FormField
                  control={form.control}
                  name="authConfig.clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sso.clientId")}</FormLabel>
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
                  name="authConfig.clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("sso.clientSecret")}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="off"
                          placeholder={existing ? t("sso.reenter") : undefined}
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

                {providerSpec.fields.includes("issuer") ? (
                  <FormField
                    control={form.control}
                    name="authConfig.issuer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sso.issuer")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.okta.com"
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
                ) : null}

                {providerSpec.fields.includes("tenantId") ? (
                  <FormField
                    control={form.control}
                    name="authConfig.tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sso.tenantId")}</FormLabel>
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
                ) : null}

                {providerSpec.fields.includes("baseUrl") ? (
                  <FormField
                    control={form.control}
                    name="authConfig.baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("sso.baseUrl")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://github.acme.com"
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
                ) : null}

                {selectedProvider === "custom" ? (
                  <>
                    <FormField
                      control={form.control}
                      name="authConfig.idToken"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={(checked) =>
                                field.onChange(checked === true)
                              }
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t("sso.idToken")}</FormLabel>
                            <FormDescription>
                              {t("sso.idTokenHint")}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </>
                ) : null}
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" loading={saveMutation.isPending}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </>
      )}
    </ConfirmationDialogController>
  );
}

function CallbackUrlPanel({ callbackUrl }: { callbackUrl: string }) {
  const { t } = useTranslation("settingsMore");
  const columns: LangfuseColumnDef<{ url: string }>[] = [
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ getValue }) => (
        <CopyableCallbackUrl value={getValue<string>()} />
      ),
    },
  ];

  return (
    <div>
      <p className="mb-2 text-sm font-bold">{t("sso.callbackUrl")}</p>
      <Card className="overflow-hidden">
        <SimpleDataTable
          columns={columns}
          data={[{ url: callbackUrl }]}
          isLoading={false}
          noResults={null}
        />
      </Card>
      <p className="text-muted-foreground mt-2 text-xs">
        {t("sso.callbackHint")}
      </p>
    </div>
  );
}

function CopyableCallbackUrl({ value }: { value: string }) {
  const { t } = useTranslation("settingsMore");
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <div className="relative pr-8 font-mono break-all">
      <span>{value}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute top-1/2 right-0 -translate-y-1/2"
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

function DeleteSsoConfigDialogController({
  orgId,
  children,
}: {
  orgId: string;
  children: (control: {
    openDialog: (domain: string) => void;
  }) => React.ReactNode;
}) {
  const { t } = useTranslation("settingsMore");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const utils = api.useUtils();

  const deleteMutation = api.ssoConfig.delete.useMutation({
    onSuccess: () => {
      utils.ssoConfig.get.invalidate({ orgId });
      showSuccessToast({
        title: t("sso.disabled"),
        description: t("sso.removedHint", { domain: selectedDomain }),
      });
    },
    onError: (err) => {
      showErrorToast(t("sso.removeFailed"), err.message);
    },
  });

  return (
    <ConfirmationDialogController
      title={t("sso.removeTitle", {
        domain: selectedDomain ?? t("sso.thisDomain"),
      })}
      text={t("sso.removeHint")}
      confirmLabel={t("common.remove")}
      variant="destructive"
      loading={deleteMutation.isPending}
      onConfirm={async () => {
        if (!selectedDomain) return;
        await deleteMutation.mutateAsync({ orgId, domain: selectedDomain });
      }}
    >
      {({ openDialog }) =>
        children({
          openDialog: (domain) => {
            setSelectedDomain(domain);
            openDialog();
          },
        })
      }
    </ConfirmationDialogController>
  );
}

// Build the SsoProviderSchema-shaped payload from the flat form values.
// Handles the nested github-enterprise.enterprise.baseUrl shape.
function buildSsoPayload(domain: string, values: FormValues) {
  const { authProvider, authConfig } = values;
  // allowDangerousEmailAccountLinking is required for SSO migration of
  // existing accounts. Cross-tenant misuse is prevented by the DNS-verified
  // domain check at save time + the runtime domain enforcement in
  // web/src/server/auth.ts.
  const base = {
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    allowDangerousEmailAccountLinking: true,
  };

  switch (authProvider) {
    case "google":
    case "github":
    case "gitlab":
      return { domain, authProvider, authConfig: base };
    case "github-enterprise":
      return {
        domain,
        authProvider,
        authConfig: {
          ...base,
          enterprise: { baseUrl: authConfig.baseUrl ?? "" },
        },
      };
    case "azure-ad":
      return {
        domain,
        authProvider,
        authConfig: { ...base, tenantId: authConfig.tenantId ?? "" },
      };
    case "auth0":
    case "okta":
    case "authentik":
    case "onelogin":
    case "cognito":
    case "keycloak":
    case "jumpcloud":
      return {
        domain,
        authProvider,
        authConfig: { ...base, issuer: authConfig.issuer ?? "" },
      };
    case "custom":
      return {
        domain,
        authProvider,
        authConfig: {
          ...base,
          issuer: authConfig.issuer ?? "",
          name: authConfig.name ?? "",
          idToken: authConfig.idToken ?? true,
        },
      };
    default:
      return { domain, authProvider, authConfig: base };
  }
}
