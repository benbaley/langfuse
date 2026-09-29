/* eslint-disable no-nested-ternary */
/* eslint-disable @repo/no-null-render */
import { showSuccessToast, showErrorToast } from "@/src/features/notifications";
import React, { useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Lock, LockOpen, Plus, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DialogBody,
  DialogDescription,
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
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { api } from "@/src/utils/api";
import { useHasProjectAccess } from "@/src/features/rbac";
import { CodeMirrorEditor } from "@/src/components/editor/CodeMirrorEditor";
import { CodeView } from "@/src/components/ui/CodeJsonViewer";
import { type Prisma, WebhookProtectedHeaders } from "@langfuse/shared";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getFormattedPayload } from "@/src/features/experiments/utils/format";
import { Spinner } from "@/src/components/design-system/Spinner/Spinner";
import { Trans, useTranslation } from "react-i18next";

const RemoteExperimentSetupSchema = z.object({
  url: z.url(),
  defaultPayload: z.string(),
  enabled: z.boolean(),
  signingEnabled: z.boolean(),
  headers: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      isSecret: z.boolean(),
      displayValue: z.string().optional(),
    }),
  ),
});

type RemoteExperimentSetupForm = z.infer<typeof RemoteExperimentSetupSchema>;

export const RemoteExperimentUpsertForm = ({
  projectId,
  datasetId,
  existingRemoteExperiment,
  setShowRemoteExperimentUpsertForm,
  onBack,
}: {
  projectId: string;
  datasetId: string;
  existingRemoteExperiment?: {
    url: string;
    payload: Prisma.JsonValue;
    enabled?: boolean;
    displaySecretKey?: string | null;
    displayHeaders?: Record<string, { secret: boolean; value: string }>;
  } | null;
  setShowRemoteExperimentUpsertForm: (show: boolean) => void;
  onBack?: () => void;
}) => {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const hasDatasetAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });

  const dataset = api.datasets.byId.useQuery({
    projectId,
    datasetId,
  });
  const utils = api.useUtils();

  // Set when the mutation generated a new signing secret; shown exactly once.
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);

  const form = useForm<RemoteExperimentSetupForm>({
    resolver: zodResolver(RemoteExperimentSetupSchema),
    defaultValues: {
      url: existingRemoteExperiment?.url || "",
      defaultPayload: getFormattedPayload(existingRemoteExperiment?.payload),
      enabled: existingRemoteExperiment?.enabled ?? true,
      signingEnabled: Boolean(existingRemoteExperiment?.displaySecretKey),
      headers: Object.entries(
        existingRemoteExperiment?.displayHeaders ?? {},
      ).map(([name, header]) => ({
        name,
        value: "",
        isSecret: header.secret,
        displayValue: header.value,
      })),
    },
  });

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  const upsertRemoteExperimentMutation =
    api.datasets.upsertRemoteExperiment.useMutation({
      onSuccess: (data) => {
        showSuccessToast({
          title: tFeatures("ui.setupSuccessfully"),
          description: tMore("experiments.saved"),
        });
        utils.datasets.getRemoteExperiment.invalidate({
          projectId,
          datasetId,
        });
        if (data.unencryptedSecretKey) {
          setOneTimeSecret(data.unencryptedSecretKey);
        } else {
          setShowRemoteExperimentUpsertForm(false);
        }
      },
      onError: (error) => {
        showErrorToast(
          error.message || "Failed to setup",
          "Please check your URL and config and try again.",
        );
      },
    });

  const deleteRemoteExperimentMutation =
    api.datasets.deleteRemoteExperiment.useMutation({
      onSuccess: () => {
        showSuccessToast({
          title: tFeatures("ui.deletedSuccessfully"),
          description: tMore("experiments.remoteRemoved"),
        });
        setShowRemoteExperimentUpsertForm(false);
        utils.datasets.getRemoteExperiment.invalidate({
          projectId,
          datasetId,
        });
      },
      onError: (error) => {
        showErrorToast(
          error.message || "Failed to delete remote dataset run trigger",
          "Please try again.",
        );
      },
    });

  const onSubmit = (data: RemoteExperimentSetupForm) => {
    if (data.defaultPayload.trim()) {
      try {
        JSON.parse(data.defaultPayload);
      } catch {
        form.setError("defaultPayload", {
          message: tMore("experiments.invalidJson"),
        });
        return;
      }
    }

    const requestHeaders: Record<string, { secret: boolean; value: string }> =
      {};
    for (const [index, header] of data.headers.entries()) {
      const name = header.name.trim();
      if (!name) continue;
      if (WebhookProtectedHeaders.includes(name.toLowerCase())) {
        form.setError(`headers.${index}.name`, {
          message: tMore("experiments.name", { key: name }),
        });
        return;
      }
      requestHeaders[name] = {
        secret: header.isSecret,
        value: header.value,
      };
    }

    upsertRemoteExperimentMutation.mutate({
      projectId,
      datasetId,
      url: data.url,
      defaultPayload: data.defaultPayload,
      enabled: data.enabled,
      signingEnabled: data.signingEnabled,
      requestHeaders,
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this remote dataset run trigger?",
      )
    ) {
      deleteRemoteExperimentMutation.mutate({
        projectId,
        datasetId,
      });
    }
  };

  if (!hasDatasetAccess) {
    return null;
  }

  if (dataset.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (oneTimeSecret) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{tFeatures("ui.saveYourSigningSecret")}</DialogTitle>
          <DialogDescription>
            <Trans
              ns="coreMore"
              i18nKey="experiments.signingHelp"
              components={{ header: <code /> }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <CodeView content={oneTimeSecret} defaultCollapsed={false} />
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => setShowRemoteExperimentUpsertForm(false)}
          >
            {tFeatures("ui.iVeSavedTheSecret")}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <Button
          variant="ghost"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setShowRemoteExperimentUpsertForm(false);
            }
          }}
          className="inline-block self-start"
        >
          {tFeatures("ui.back")}
        </Button>
        <DialogTitle>
          {existingRemoteExperiment
            ? tFeatures("ui.editRemoteExperimentTrigger")
            : tFeatures("ui.setUpRemoteExperimentTriggerInUi")}
        </DialogTitle>
        <DialogDescription>
          {tMore("experiments.remoteSetupHelp", {
            dataset: dataset.data?.name ?? tFeatures("ui.loading"),
          })}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogBody>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormDescription>
                    {tFeatures(
                      "ui.theUrlThatWillBeCalledWhenTheRemoteExperimentIsTriggered",
                    )}
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="https://your-service.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  {field.value.startsWith("http://") && (
                    <p className="text-dark-yellow text-sm">
                      {tMore("experiments.httpWarning")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultPayload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tFeatures("ui.defaultConfig")}</FormLabel>
                  <FormDescription>
                    {tMore("experiments.defaultConfig")}
                  </FormDescription>
                  <CodeMirrorEditor
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    editable
                    mode="json"
                    minHeight={200}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{tFeatures("ui.signRequests")}</FormLabel>
                    <FormDescription>
                      {field.value
                        ? existingRemoteExperiment?.displaySecretKey
                          ? "Requests include an x-langfuse-signature header so your service can verify they come from Langfuse."
                          : tFeatures(
                              "ui.aSigningSecretWillBeGeneratedWhenYouSaveAndShownOnce",
                            )
                        : tFeatures(
                            "ui.requestsWillBeSentWithoutAnXLangfuseSignatureHeader",
                          )}
                    </FormDescription>
                    {field.value &&
                      existingRemoteExperiment?.displaySecretKey && (
                        <div className="pt-2">
                          <CodeView
                            className="bg-muted/50"
                            content={existingRemoteExperiment.displaySecretKey}
                            defaultCollapsed={true}
                          />
                          <div className="text-muted-foreground mt-1 text-xs">
                            {tFeatures(
                              "ui.secretIsEncryptedAndCanOnlyBeViewedWhenGenerated",
                            )}
                          </div>
                        </div>
                      )}
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

            <AccordionPrimitive.Root type="single" collapsible>
              <AccordionPrimitive.Item value="advanced">
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-start gap-2 py-2 text-sm font-bold transition-all hover:underline [&>svg]:order-first [&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0">
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    {tFeatures("ui.advancedOptions")}
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm transition-all">
                  <div className="space-y-6 px-1 pt-2 pb-4">
                    <div>
                      <FormLabel>{tFeatures("ui.customHeaders")}</FormLabel>
                      <FormDescription className="mb-2">
                        {tMore("experiments.headersHelp")}
                      </FormDescription>

                      {headerFields.map((field, index) => {
                        const isSecret = form.watch(
                          `headers.${index}.isSecret`,
                        );
                        const displayValue = form.watch(
                          `headers.${index}.displayValue`,
                        );

                        return (
                          <div
                            key={field.id}
                            className="mb-2 grid grid-cols-[1fr_1fr_auto_auto] gap-2"
                          >
                            <FormField
                              control={form.control}
                              name={`headers.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder={tFeatures("ui.headerName")}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
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
                                        displayValue || tFeatures("ui.value")
                                      }
                                      {...field}
                                      type={isSecret ? "password" : "text"}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                form.setValue(
                                  `headers.${index}.isSecret`,
                                  !isSecret,
                                )
                              }
                              title={
                                isSecret
                                  ? tFeatures("ui.makeHeaderPublic")
                                  : tFeatures("ui.makeHeaderSecret")
                              }
                            >
                              {isSecret ? (
                                <Lock className="h-4 w-4 text-orange-500" />
                              ) : (
                                <LockOpen className="text-muted-foreground h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeHeader(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          appendHeader({
                            name: "",
                            value: "",
                            isSecret: false,
                            displayValue: "",
                          })
                        }
                        className="mt-2"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {tFeatures("ui.addCustomHeader")}
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{tFeatures("ui.enabled")}</FormLabel>
                            <FormDescription>
                              {field.value
                                ? tFeatures(
                                    "ui.triggerIsActiveYouCanDisableAnytimeToPauseWithoutLosingYourConfiguration",
                                  )
                                : tFeatures(
                                    "ui.triggerIsPausedEnableToAllowRunningRemoteExperiments",
                                  )}
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
                  </div>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            </AccordionPrimitive.Root>
          </DialogBody>

          <DialogFooter>
            <div className="flex w-full justify-between">
              {existingRemoteExperiment && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteRemoteExperimentMutation.isPending}
                >
                  {deleteRemoteExperimentMutation.isPending && (
                    <div className="mr-2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {tFeatures("ui.delete")}
                </Button>
              )}
              <Button
                type="submit"
                className="ml-auto"
                disabled={upsertRemoteExperimentMutation.isPending}
              >
                {upsertRemoteExperimentMutation.isPending ? (
                  <div className="mr-2">
                    <Spinner size="sm" />
                  </div>
                ) : null}
                {existingRemoteExperiment
                  ? tFeatures("ui.update")
                  : tFeatures("ui.setUp")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};
