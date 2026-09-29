/* eslint-disable no-nested-ternary */
import { Trans, useTranslation } from "react-i18next";
import { MixpanelLogo } from "@/src/components/MixpanelLogo";
import Header from "@/src/components/layouts/header";
import ContainerPage from "@/src/components/layouts/container-page";
import { StatusBadge } from "@/src/components/ui/StatusBadge/StatusBadge";
import { Button } from "@/src/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { PasswordInput } from "@/src/components/design-system/PasswordInput/PasswordInput";
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/src/components/ui/tooltip";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import {
  mixpanelIntegrationFormSchema,
  MIXPANEL_REGIONS,
  type MixpanelRegion,
} from "@/src/features/mixpanel-integration/types";
import {
  LEGACY_ANALYTICS_EXPORTER_CUTOFF,
  validateExportSource,
  type V4WriteMode,
  type ExportSourceContext,
} from "@langfuse/shared";
import { Alert } from "@/src/components/design-system/Alert/Alert";

// Shared export-source UI adapters; policy in export-source-policy.ts.
import {
  buildExportSourceContext,
  getExportSourceFieldState,
  isExportSourceSelectable,
  IntegrationSettingsSkeleton,
} from "@/src/features/analytics-integrations";
import { useLangfuseCloudRegion } from "@/src/features/organizations";
import { useQueryProject } from "@/src/features/projects";
import { useHasProjectAccess } from "@/src/features/rbac";
import { api } from "@/src/utils/api";
import { type RouterOutput } from "@/src/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/src/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Info, ExternalLink } from "lucide-react";

export default function MixpanelIntegrationPage() {
  const { t, i18n } = useTranslation("settingsMore");
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "integrations:CRUD",
  });
  const state = api.mixpanelIntegration.get.useQuery(
    { projectId },
    {
      enabled: hasAccess,
    },
  );

  const { project } = useQueryProject();

  const status =
    state.isLoading || !hasAccess
      ? undefined
      : state.data?.config?.enabled
        ? "active"
        : "inactive";

  return (
    <ContainerPage
      headerProps={{
        title: t("integrations.mixpanelTitle"),
        breadcrumb: [
          {
            name: t("common.settings"),
            href: `/project/${projectId}/settings`,
          },
        ],
        actionButtonsLeft: <>{status && <StatusBadge type={status} />}</>,
        actionButtonsRight: (
          <Button asChild variant="secondary">
            <Link href="https://langfuse.com/integrations/analytics/mixpanel">
              {t("common.integrationDocsLink")}
            </Link>
          </Button>
        ),
      }}
    >
      <p className="text-primary mb-4 text-sm">
        <Trans
          t={t}
          i18nKey="integrations.mixpanelDescription"
          components={{
            link: <Link href="https://mixpanel.com" className="underline" />,
          }}
        />
      </p>
      {!hasAccess && (
        <p className="text-sm">{t("integrations.accessDenied")}</p>
      )}
      {hasAccess && (
        <>
          <Header title={t("common.configuration")} />
          <Card className="p-3">
            <MixpanelLogo className="text-foreground mb-4 w-20" />
            {!state.data || !project ? (
              <IntegrationSettingsSkeleton />
            ) : (
              <MixpanelIntegrationSettingsForm
                // Draft lifetime = entity identity, so background refetches
                // cannot reset a draft in progress.
                key={`${projectId}:${state.data.config ? "configured" : "new"}`}
                state={state.data.config ?? undefined}
                projectId={projectId}
                writeMode={state.data.writeMode}
                projectCreatedAt={project.createdAt}
              />
            )}
          </Card>
        </>
      )}
      {state.data?.config?.enabled && (
        <>
          <Header title={t("common.status")} className="mt-8" />
          <p className="text-primary text-sm">
            {t("integrations.syncedUntil", {
              date: state.data?.config?.lastSyncAt
                ? new Date(state.data.config.lastSyncAt).toLocaleString(
                    i18n.language,
                  )
                : t("integrations.never"),
            })}
          </p>
        </>
      )}
    </ContainerPage>
  );
}

const MixpanelIntegrationSettingsForm = ({
  state,
  projectId,
  writeMode,
  projectCreatedAt,
}: {
  state?: NonNullable<RouterOutput["mixpanelIntegration"]["get"]["config"]>;
  projectId: string;
  writeMode: V4WriteMode;
  // Raw ISO string, not a Date: a Date built in the parent's JSX would be a new
  // reference on every render and would defeat the memo below.
  projectCreatedAt: string;
}) => {
  const { t } = useTranslation("settingsMore");
  const capture = usePostHogClientCapture();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  const integrationCreatedAt = state?.createdAt;
  const exportSourceCtx: ExportSourceContext = useMemo(
    () =>
      buildExportSourceContext({
        writeMode,
        isCloud: isLangfuseCloud,
        projectCreatedAt: new Date(projectCreatedAt),
        integrationCreatedAt: integrationCreatedAt
          ? new Date(integrationCreatedAt)
          : null,
        exporterCutoff: LEGACY_ANALYTICS_EXPORTER_CUTOFF,
      }),
    [writeMode, isLangfuseCloud, projectCreatedAt, integrationCreatedAt],
  );
  const {
    options: exportSourceOptions,
    showField: showExportSourceField,
    defaultValue: defaultExportSource,
  } = getExportSourceFieldState(state?.exportSource, exportSourceCtx);

  // Blocked-save validation instead of silent rewrite.
  const formSchema = useMemo(
    () =>
      mixpanelIntegrationFormSchema.superRefine((data, ctx) => {
        // The credential is write-only: blank keeps the saved token, so it is
        // only required when no integration exists yet.
        if (!state && !data.mixpanelProjectToken) {
          ctx.addIssue({
            code: "custom",
            path: ["mixpanelProjectToken"],
            message: "settingsMore:validation.mixpanelTokenRequired",
          });
        }
        if (!isExportSourceSelectable(data.exportSource, exportSourceCtx)) {
          ctx.addIssue({
            code: "custom",
            path: ["exportSource"],
            message: "settingsMore:integrations.unavailableSource",
          });
        }
      }),
    [exportSourceCtx, state],
  );

  const mixpanelForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mixpanelRegion:
        (state?.mixpanelRegion as MixpanelRegion) ??
        MIXPANEL_REGIONS[0].subdomain,
      mixpanelProjectToken: "",
      enabled: state?.enabled ?? false,
      exportSource: defaultExportSource,
    },
  });

  const watchedExportSource = mixpanelForm.watch("exportSource");
  const watchedValidation =
    watchedExportSource != null
      ? validateExportSource(watchedExportSource, exportSourceCtx)
      : ({ ok: true } as const);

  const utils = api.useUtils();
  const mut = api.mixpanelIntegration.update.useMutation({
    onSuccess: () => {
      utils.mixpanelIntegration.invalidate();
    },
  });
  const mutDelete = api.mixpanelIntegration.delete.useMutation({
    onSuccess: () => {
      utils.mixpanelIntegration.invalidate();
    },
  });

  async function onSubmit(
    values: z.infer<typeof mixpanelIntegrationFormSchema>,
  ) {
    capture("integrations:mixpanel_form_submitted");
    mut.mutate({
      projectId,
      ...values,
    });
  }

  return (
    <Form {...mixpanelForm}>
      <form
        className="space-y-3"
        onSubmit={mixpanelForm.handleSubmit(onSubmit)}
      >
        <FormField
          control={mixpanelForm.control}
          name="mixpanelRegion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integrations.mixpanelRegion")}</FormLabel>
              <FormControl>
                <SelectInput
                  onValueChange={field.onChange}
                  value={field.value}
                  placeholder={t("integrations.selectRegion")}
                  options={MIXPANEL_REGIONS.map((region) => ({
                    value: region.subdomain,
                    label: region.description,
                  }))}
                />
              </FormControl>
              <FormDescription>
                {t("integrations.mixpanelRegionHint")}
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
          control={mixpanelForm.control}
          name="mixpanelProjectToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("integrations.mixpanelToken")}</FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  placeholder={state?.mixpanelProjectTokenDisplay}
                />
              </FormControl>
              <FormDescription>
                {state
                  ? t("integrations.keepToken")
                  : t("integrations.mixpanelTokenHint")}
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
        {showExportSourceField && (
          <FormField
            control={mixpanelForm.control}
            name="exportSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 pt-2">
                  {t("integrations.exportSource")}
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-[350px] space-y-2 p-3"
                    >
                      {exportSourceOptions.map((option) => (
                        <div key={option.value} className="space-y-0.5">
                          <div className="font-bold">
                            {t(`integrations.source.${option.value}.label`)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {t(
                              `integrations.source.${option.value}.description`,
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2">
                        <a
                          href="https://langfuse.com/docs/integrations/export-sources"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          {t("common.moreInfo")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <SelectInput
                    onValueChange={field.onChange}
                    value={field.value}
                    placeholder={t("integrations.selectSource")}
                    options={exportSourceOptions.map((option) => {
                      if (option.unavailable) {
                        return {
                          value: option.value,
                          label: t("integrations.sourceUnavailableLabel", {
                            source: t(
                              `integrations.source.${option.value}.label`,
                            ),
                          }),
                          disabled: true as const,
                          disabledReason: t(
                            "integrations.sourceUnavailableReason",
                          ),
                        };
                      }

                      return {
                        value: option.value,
                        label: t(`integrations.source.${option.value}.label`),
                      };
                    })}
                  />
                </FormControl>
                <FormDescription>
                  {t("integrations.mixpanelSourceHint")}
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
        )}
        {!watchedValidation.ok && (
          <Alert variant="destructive">
            <Alert.Title>
              {t("integrations.savedSourceUnavailable")}
            </Alert.Title>
            <Alert.Description>
              {t(`integrations.blocked.${watchedValidation.reason}`)}
            </Alert.Description>
          </Alert>
        )}
        <FormField
          control={mixpanelForm.control}
          name="enabled"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.enabled")}</FormLabel>
              <FormControl>
                <div className="mt-1 ml-4">
                  <Switch
                    id="mixpanel-integration-enabled"
                    checked={field.value}
                    onCheckedChange={() => {
                      field.onChange(!field.value);
                    }}
                  />
                </div>
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
      </form>
      <div className="mt-8 flex gap-2">
        <Button
          loading={mut.isPending}
          onClick={mixpanelForm.handleSubmit(onSubmit)}
        >
          {t("common.save")}
        </Button>
        <Button
          variant="ghost"
          loading={mutDelete.isPending}
          disabled={!state}
          onClick={() => {
            if (
              confirm(
                "Are you sure you want to reset the Mixpanel integration for this project?",
              )
            )
              mutDelete.mutate({ projectId });
          }}
        >
          {t("common.reset")}
        </Button>
      </div>
    </Form>
  );
};
