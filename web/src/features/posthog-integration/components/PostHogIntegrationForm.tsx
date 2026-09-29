import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  validateExportSource,
  type ExportSourceContext,
} from "@langfuse/shared";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { type z } from "zod";

import { Alert } from "@/src/components/design-system/Alert/Alert";
import { ConfirmationDialogController } from "@/src/components/design-system/ConfirmationDialogController/ConfirmationDialogController";
import { CustomTooltip } from "@/src/components/design-system/CustomTooltip/CustomTooltip";
import { createForm } from "@/src/components/design-system/factories/createForm";
import { Input } from "@/src/components/design-system/Input/Input";
import { PasswordInput } from "@/src/components/design-system/PasswordInput/PasswordInput";
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
import { SwitchInput } from "@/src/components/design-system/SwitchInput/SwitchInput";
import {
  getExportSourceFieldState,
  isExportSourceSelectable,
} from "@/src/features/analytics-integrations";
import { posthogIntegrationFormSchema } from "@/src/features/posthog-integration/types";

type PostHogIntegrationFormInput = z.input<typeof posthogIntegrationFormSchema>;

export type PostHogIntegrationFormValues = z.output<
  typeof posthogIntegrationFormSchema
>;

const PostHogForm = createForm<
  PostHogIntegrationFormInput,
  PostHogIntegrationFormValues
>();
const { useForm } = PostHogForm;

type PostHogIntegrationFormProps = {
  actionState: "idle" | "saving" | "resetting";
  configurationState: "new" | "configured";
  defaultValues: Required<PostHogIntegrationFormValues>;
  // Required to validate the selected export source against deployment policy.
  exportSourceContext: ExportSourceContext;
  onReset: () => void | Promise<void>;
  onSubmit: (values: PostHogIntegrationFormValues) => void;
  projectApiKeyDisplay?: string;
  resetError?: string;
};

export function PostHogIntegrationForm({
  actionState,
  configurationState,
  defaultValues,
  exportSourceContext,
  onReset,
  onSubmit,
  projectApiKeyDisplay,
  resetError,
}: PostHogIntegrationFormProps) {
  const { t } = useTranslation("settingsMore");
  const { options: exportSourceOptions, showField: showExportSourceField } =
    getExportSourceFieldState(defaultValues.exportSource, exportSourceContext);
  const formSchema = useMemo(
    () =>
      posthogIntegrationFormSchema.superRefine((data, ctx) => {
        if (configurationState === "new" && !data.posthogProjectApiKey) {
          ctx.addIssue({
            code: "custom",
            path: ["posthogProjectApiKey"],
            message: t("validation.posthogKeyRequired"),
          });
        }
        if (!isExportSourceSelectable(data.exportSource, exportSourceContext)) {
          ctx.addIssue({
            code: "custom",
            path: ["exportSource"],
            message: t("integrations.unavailableSource"),
          });
        }
      }),
    [configurationState, exportSourceContext, t],
  );
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const exportSource = useWatch({
    control: form.control,
    name: "exportSource",
  });
  const exportSourceValidation = exportSource
    ? validateExportSource(exportSource, exportSourceContext)
    : ({ ok: true } as const);

  return (
    <ConfirmationDialogController
      title={t("integrations.resetPosthog")}
      text={t("integrations.resetPosthogHint")}
      confirmLabel={t("integrations.reset")}
      variant="destructive"
      disabled={configurationState === "new"}
      loading={actionState === "resetting"}
      error={resetError}
      onConfirm={onReset}
    >
      {({ openDialog }) => (
        <PostHogForm
          form={form}
          onSubmit={onSubmit}
          actions={[
            {
              id: "save",
              type: "submit",
              text: t("common.save"),
              loading: actionState === "saving",
            },
            {
              id: "reset",
              type: "button",
              text: t("common.reset"),
              variant: "ghost",
              disabled: configurationState === "new",
              onClick: openDialog,
            },
          ]}
        >
          <PostHogForm.Field
            name="posthogHostname"
            label={t("integrations.posthogHost")}
            description={t("integrations.posthogHostHint")}
          >
            {(field) => (
              <Input
                id={field.id}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                ref={field.ref}
                aria-describedby={field.inputDescribedById}
                aria-invalid={Boolean(field.error)}
                error={Boolean(field.error)}
              />
            )}
          </PostHogForm.Field>
          <PostHogForm.Field
            name="posthogProjectApiKey"
            label={t("integrations.posthogKey")}
            description={
              configurationState === "configured"
                ? t("integrations.keepApiKey")
                : undefined
            }
          >
            {(field) => (
              <PasswordInput
                id={field.id}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                ref={field.ref}
                aria-describedby={field.inputDescribedById}
                aria-invalid={Boolean(field.error)}
                error={Boolean(field.error)}
                placeholder={
                  configurationState === "configured"
                    ? projectApiKeyDisplay
                    : undefined
                }
              />
            )}
          </PostHogForm.Field>
          {showExportSourceField ? (
            <CustomTooltip
              placement="bottom"
              content={
                <div className="space-y-2 py-1.5">
                  {exportSourceOptions.map((option) => (
                    <div key={option.value} className="space-y-0.5">
                      <div className="font-bold">
                        {t(`integrations.source.${option.value}.label`)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {t(`integrations.source.${option.value}.description`)}
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
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              }
            >
              {({ getTriggerProps }) => (
                <PostHogForm.Field
                  name="exportSource"
                  label={t("integrations.exportSource")}
                  description={t("integrations.posthogSourceHint")}
                  registerLabelTooltip={getTriggerProps}
                >
                  {(field) => (
                    <SelectInput
                      id={field.id}
                      value={field.value}
                      onValueChange={field.onChange}
                      aria-describedby={field.inputDescribedById}
                      aria-invalid={Boolean(field.error)}
                      error={Boolean(field.error)}
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
                  )}
                </PostHogForm.Field>
              )}
            </CustomTooltip>
          ) : null}
          {!exportSourceValidation.ok ? (
            <Alert variant="destructive">
              <Alert.Title>
                {t("integrations.savedSourceUnavailable")}
              </Alert.Title>
              <Alert.Description>
                {t(`integrations.blocked.${exportSourceValidation.reason}`)}
              </Alert.Description>
            </Alert>
          ) : null}
          <PostHogForm.Field name="enabled" label={t("common.enabled")}>
            {(field) => (
              <SwitchInput
                id={field.id}
                description={t("integrations.posthogEnabledHint")}
                name={field.name}
                checked={field.value}
                onBlur={field.onBlur}
                onCheckedChange={field.onChange}
                ref={field.ref}
                aria-describedby={field.inputDescribedById}
                aria-invalid={Boolean(field.error)}
              />
            )}
          </PostHogForm.Field>
        </PostHogForm>
      )}
    </ConfirmationDialogController>
  );
}
