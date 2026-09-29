/* eslint-disable no-nested-ternary */
import { Trans, useTranslation } from "react-i18next";
import { useFieldArray, useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type BedrockApiKey,
  type BedrockAccessKeys,
  type BedrockConfig,
  type OpenAIConfig,
  type VertexAIConfig,
  LLMAdapter,
  BEDROCK_USE_DEFAULT_CREDENTIALS,
  VERTEXAI_USE_DEFAULT_CREDENTIALS,
  isDecisionModelAdapter,
} from "@langfuse/shared";
import { ChevronDown, PlusIcon, TrashIcon } from "lucide-react";
import { z } from "zod";
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
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { Tabs } from "@/src/components/design-system/Tabs/Tabs";
import { api, reportNonTrpcError, type RouterOutputs } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import { type useUiCustomization } from "@/src/ee/features/ui-customization";
import { DialogFooter, DialogBody } from "@/src/components/ui/dialog";
import { env } from "@/src/env.mjs";
import {
  AuthMethod,
  BedrockAuthMethodSchema,
  type BedrockAuthMethod,
} from "@/src/features/llm-api-key";
const isLangfuseCloud = Boolean(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION);

/**
 * UI-only sentinel value for the adapter dropdown. Selecting it does not set a
 * real adapter; instead it surfaces guidance that any OpenAI-compatible
 * provider can be added through one of the existing adapters.
 */
const OTHER_MODEL_OPTION = "other-model";

const isCustomModelsRequired = (adapter: LLMAdapter) =>
  adapter === LLMAdapter.Azure || adapter === LLMAdapter.Bedrock;

const hasText = (value?: string) => Boolean(value?.trim());

/**
 * Whether the selected auth method matches the existing one (i.e. credentials
 * can be preserved on update). DefaultCredentials is grouped with AccessKeys
 * because both use SigV4-based authentication via the AWS SDK.
 */
const isMatchingBedrockAuthMethod = (
  newAuthMethod: BedrockAuthMethod,
  existingAuthMethod?: BedrockAuthMethod,
): boolean =>
  (newAuthMethod === AuthMethod.ApiKey &&
    existingAuthMethod === AuthMethod.ApiKey) ||
  (newAuthMethod === AuthMethod.AccessKeys &&
    (existingAuthMethod === AuthMethod.AccessKeys ||
      existingAuthMethod === AuthMethod.DefaultCredentials));

type LlmApiKeyListItem = RouterOutputs["llmApiKey"]["all"]["data"][number];

const getInitialBedrockAuthMethod = (params: {
  mode: "create" | "update";
  existingAuthMethod?: BedrockAuthMethod;
}): BedrockAuthMethod => {
  if (params.mode === "update") {
    return params.existingAuthMethod === AuthMethod.ApiKey
      ? AuthMethod.ApiKey
      : AuthMethod.AccessKeys;
  }

  return AuthMethod.AccessKeys;
};

const createFormSchema = (params: {
  mode: "create" | "update";
  existingAuthMethod?: BedrockAuthMethod;
}) =>
  z
    .object({
      secretKey: z.string().optional(),
      provider: z
        .string()
        .min(1, "settingsMore:validation.providerRequired")
        .regex(/^[^:]+$/, "settingsMore:validation.providerColon"),
      adapter: z.enum(LLMAdapter),
      baseURL: z.union([
        z.literal(""),
        z.url({ message: "settingsMore:validation.validUrl" }),
      ]),
      withDefaultModels: z.boolean(),
      customModels: z.array(
        z.object({
          value: z.string().min(1, "settingsMore:validation.required"),
        }),
      ),
      awsAccessKeyId: z.string().optional(),
      awsSecretAccessKey: z.string().optional(),
      bedrockApiKey: z.string().optional(),
      authMethod: BedrockAuthMethodSchema,
      awsRegion: z.string().optional(),
      vertexAILocation: z.string().optional(),
      openAIUseResponsesApi: z.boolean(),
      extraHeaders: z.array(
        z.object({
          key: z.string().min(1, "settingsMore:validation.required"),
          value:
            params.mode === "create"
              ? z.string().min(1, "settingsMore:validation.required")
              : z.string().optional(),
        }),
      ),
    })
    .superRefine((data, ctx) => {
      if (data.adapter !== LLMAdapter.Bedrock) return;

      const hasRegion = hasText(data.awsRegion);
      const hasAccessKeyId = hasText(data.awsAccessKeyId);
      const hasSecretAccessKey = hasText(data.awsSecretAccessKey);
      const hasBedrockApiKey = hasText(data.bedrockApiKey);
      const hasAnyAccessKeys = hasAccessKeyId || hasSecretAccessKey;
      const { authMethod } = data;
      const isUpdatingCurrentAuthMethod =
        params.mode === "update" &&
        isMatchingBedrockAuthMethod(authMethod, params.existingAuthMethod);

      if (!hasRegion) {
        ctx.addIssue({
          code: "custom",
          message: "settingsMore:validation.regionRequired",
          path: ["awsRegion"],
        });
      }

      if (authMethod === AuthMethod.AccessKeys) {
        if (isUpdatingCurrentAuthMethod && !hasAnyAccessKeys) {
          return;
        }

        if (!isLangfuseCloud && !hasAnyAccessKeys) {
          return;
        }

        if (!hasAccessKeyId) {
          ctx.addIssue({
            code: "custom",
            message: "settingsMore:validation.awsIdRequired",
            path: ["awsAccessKeyId"],
          });
        }

        if (!hasSecretAccessKey) {
          ctx.addIssue({
            code: "custom",
            message: "settingsMore:validation.awsSecretRequired",
            path: ["awsSecretAccessKey"],
          });
        }
        return;
      }

      if (isUpdatingCurrentAuthMethod && !hasBedrockApiKey) {
        return;
      }

      if (!hasBedrockApiKey) {
        ctx.addIssue({
          code: "custom",
          message: "settingsMore:validation.bedrockKeyRequired",
          path: ["bedrockApiKey"],
        });
      }
    })
    .refine(
      (data) => {
        if (isCustomModelsRequired(data.adapter)) {
          return data.customModels.length > 0;
        }
        return true;
      },
      {
        message: "settingsMore:validation.customModelRequired",
        path: ["customModels"],
      },
    )
    // 2) For adapters that support defaults, require default models or at least one custom model
    .refine(
      (data) => {
        if (isCustomModelsRequired(data.adapter)) {
          return true;
        }
        return data.withDefaultModels || data.customModels.length > 0;
      },
      {
        message: "settingsMore:validation.modelRequired",
        path: ["withDefaultModels"],
      },
    )
    // Vertex AI validation - service account key or ADC sentinel value required
    .refine(
      (data) => {
        if (data.adapter !== LLMAdapter.VertexAI) return true;

        // In update mode, credentials are optional (existing ones are preserved)
        if (params.mode === "update") return true;

        // secretKey is required (either JSON key or VERTEXAI_USE_DEFAULT_CREDENTIALS sentinel)
        return !!data.secretKey;
      },
      {
        message: isLangfuseCloud
          ? "settingsMore:validation.gcpKeyRequired"
          : "settingsMore:validation.gcpCredentialsRequired",
        path: ["secretKey"],
      },
    )
    .refine(
      (data) =>
        data.adapter === LLMAdapter.Bedrock ||
        data.adapter === LLMAdapter.VertexAI ||
        params.mode === "update" ||
        data.secretKey,
      {
        message: "settingsMore:validation.secretRequired",
        path: ["secretKey"],
      },
    )
    .refine(
      (data) => {
        if (data.adapter !== LLMAdapter.Azure) return true;
        return data.baseURL && data.baseURL.trim() !== "";
      },
      {
        message: "settingsMore:validation.azureBaseRequired",
        path: ["baseURL"],
      },
    );

interface CreateLLMApiKeyFormProps {
  projectId?: string;
  onSuccess: () => void;
  customization: ReturnType<typeof useUiCustomization>;
  mode?: "create" | "update";
  existingKey?: LlmApiKeyListItem;
}

export function CreateLLMApiKeyForm({
  projectId,
  onSuccess,
  customization,
  mode = "create",
  existingKey,
}: CreateLLMApiKeyFormProps) {
  const { t } = useTranslation("settingsMore");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  // When the "Other model" option is selected we hide the form fields and show
  // guidance instead. This is purely UI state and never reaches the form value.
  const [showOtherModelInfo, setShowOtherModelInfo] = useState(false);
  const [adapterSelectOpen, setAdapterSelectOpen] = useState(false);
  const utils = api.useUtils();
  const capture = usePostHogClientCapture();

  const existingKeys = api.llmApiKey.all.useQuery(
    {
      projectId: projectId as string,
      includeDecisionModels: true,
    },
    { enabled: Boolean(projectId) },
  );
  const adapterOptions = Object.values(LLMAdapter);

  const mutCreateLlmApiKey = api.llmApiKey.create.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });

  const mutUpdateLlmApiKey = api.llmApiKey.update.useMutation({
    onSuccess: () => utils.llmApiKey.invalidate(),
  });

  const mutTestLLMApiKey = api.llmApiKey.test.useMutation();
  const mutTestUpdateLLMApiKey = api.llmApiKey.testUpdate.useMutation();

  const defaultAdapter: LLMAdapter = customization?.defaultModelAdapter
    ? LLMAdapter[customization.defaultModelAdapter]
    : LLMAdapter.OpenAI;

  const getCustomizedBaseURL = (adapter: LLMAdapter) => {
    switch (adapter) {
      case LLMAdapter.OpenAI:
        return customization?.defaultBaseUrlOpenAI ?? "";
      case LLMAdapter.Azure:
        return customization?.defaultBaseUrlAzure ?? "";
      case LLMAdapter.Anthropic:
        return customization?.defaultBaseUrlAnthropic ?? "";
      default:
        return "";
    }
  };

  const formSchema = createFormSchema({
    mode,
    existingAuthMethod: existingKey?.authMethod,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "update" && existingKey
        ? {
            adapter: existingKey.adapter as LLMAdapter,
            provider: existingKey.provider,
            secretKey:
              existingKey.adapter === LLMAdapter.VertexAI &&
              existingKey.displaySecretKey === "Default GCP credentials (ADC)"
                ? VERTEXAI_USE_DEFAULT_CREDENTIALS
                : "",
            baseURL:
              existingKey.baseURL ??
              getCustomizedBaseURL(existingKey.adapter as LLMAdapter),
            withDefaultModels: existingKey.withDefaultModels,
            customModels: existingKey.customModels.map((value) => ({ value })),
            extraHeaders:
              existingKey.extraHeaderKeys?.map((key) => ({ key, value: "" })) ??
              [],
            vertexAILocation:
              existingKey.adapter === LLMAdapter.VertexAI && existingKey.config
                ? ((existingKey.config as VertexAIConfig).location ?? "")
                : "",
            openAIUseResponsesApi:
              existingKey.adapter === LLMAdapter.OpenAI &&
              existingKey.config != null
                ? Boolean((existingKey.config as OpenAIConfig).useResponsesApi)
                : false,
            awsRegion:
              existingKey.adapter === LLMAdapter.Bedrock && existingKey.config
                ? ((existingKey.config as BedrockConfig).region ?? "")
                : "",
            awsAccessKeyId: "",
            awsSecretAccessKey: "",
            bedrockApiKey: "",
            authMethod: getInitialBedrockAuthMethod({
              mode,
              existingAuthMethod: existingKey.authMethod,
            }),
          }
        : {
            adapter: defaultAdapter,
            provider: "",
            secretKey: "",
            baseURL: getCustomizedBaseURL(defaultAdapter),
            withDefaultModels: true,
            customModels: [],
            extraHeaders: [],
            vertexAILocation: "global",
            openAIUseResponsesApi: false,
            awsRegion: "",
            awsAccessKeyId: "",
            awsSecretAccessKey: "",
            bedrockApiKey: "",
            authMethod: getInitialBedrockAuthMethod({
              mode,
            }),
          },
  });

  const currentAdapter = form.watch("adapter");
  const currentAuthMethod = form.watch("authMethod");
  const isKeepingCurrentBedrockAuthMethod =
    mode === "update" &&
    currentAdapter === LLMAdapter.Bedrock &&
    isMatchingBedrockAuthMethod(currentAuthMethod, existingKey?.authMethod);
  const isUsingDefaultAwsCredentialsForCurrentAuthMethod =
    currentAuthMethod === AuthMethod.AccessKeys &&
    existingKey?.authMethod === AuthMethod.DefaultCredentials;

  const hasAdvancedSettings = (adapter: LLMAdapter) =>
    adapter === LLMAdapter.OpenAI ||
    adapter === LLMAdapter.Anthropic ||
    adapter === LLMAdapter.VertexAI ||
    adapter === LLMAdapter.GoogleAIStudio;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customModels",
  });

  const {
    fields: headerFields,
    append: appendHeader,
    remove: removeHeader,
  } = useFieldArray({
    control: form.control,
    name: "extraHeaders",
  });

  const renderCustomModelsField = () => (
    <FormField
      control={form.control}
      name="customModels"
      render={() => (
        <FormItem>
          <FormLabel>{t("llm.customModels")}</FormLabel>
          <FormDescription>{t("llm.customModelsHint")}</FormDescription>
          {currentAdapter === LLMAdapter.Azure && (
            <FormDescription className="text-dark-yellow">
              {t("llm.azureModelsHint")}
            </FormDescription>
          )}

          {currentAdapter === LLMAdapter.Bedrock && (
            <FormDescription className="text-dark-yellow">
              {t("llm.bedrockModelsHint")}
            </FormDescription>
          )}

          {fields.map((customModel, index) => (
            <span key={customModel.id} className="flex flex-row space-x-2">
              <Input
                {...form.register(`customModels.${index}.value`)}
                placeholder={t("llm.customModelPlaceholder", {
                  number: index + 1,
                })}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => append({ value: "" })}
            className="w-full"
          >
            <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />

            {t("llm.addModel")}
          </Button>
        </FormItem>
      )}
    />
  );

  const renderExtraHeadersField = () => (
    <FormField
      control={form.control}
      name="extraHeaders"
      render={() => (
        <FormItem>
          <FormLabel>{t("llm.extraHeaders")}</FormLabel>
          <FormDescription>
            {t(
              isLangfuseCloud
                ? "llm.extraHeadersCloud"
                : "llm.extraHeadersSelfHosted",
            )}
          </FormDescription>

          {headerFields.map((header, index) => (
            <div key={header.id} className="flex flex-row space-x-2">
              <Input
                {...form.register(`extraHeaders.${index}.key`)}
                placeholder={t("llm.headerName")}
              />
              <Input
                {...form.register(`extraHeaders.${index}.value`)}
                placeholder={
                  mode === "update" &&
                  existingKey?.extraHeaderKeys &&
                  existingKey.extraHeaderKeys[index]
                    ? "***"
                    : t("llm.headerValue")
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeHeader(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            onClick={() => appendHeader({ key: "", value: "" })}
            className="w-full"
          >
            <PlusIcon className="mr-1.5 -ml-0.5 h-5 w-5" aria-hidden="true" />

            {t("llm.addHeader")}
          </Button>
        </FormItem>
      )}
    />
  );

  // Disable provider and adapter fields in update mode
  const isFieldDisabled = (fieldName: string) => {
    if (mode !== "update") return false;
    return ["provider", "adapter"].includes(fieldName);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!projectId) return console.error("No project ID found.");

    if (mode === "create") {
      if (
        existingKeys?.data?.data
          .map((k) => k.provider)
          .includes(values.provider)
      ) {
        form.setError("provider", {
          type: "manual",
          message: "settingsMore:llm.providerExists",
        });
        return;
      }
      capture("project_settings:llm_api_key_create", {
        provider: values.provider,
      });
    } else {
      capture("project_settings:llm_api_key_update", {
        provider: values.provider,
      });
    }

    let secretKey = values.secretKey;
    let config: BedrockConfig | OpenAIConfig | VertexAIConfig | undefined;

    if (currentAdapter === LLMAdapter.Bedrock) {
      const shouldPreserveExistingBedrockCredentials =
        mode === "update" &&
        isMatchingBedrockAuthMethod(values.authMethod, existingKey?.authMethod);

      switch (values.authMethod) {
        case AuthMethod.ApiKey:
          secretKey =
            shouldPreserveExistingBedrockCredentials && !values.bedrockApiKey
              ? undefined
              : JSON.stringify({
                  apiKey: values.bedrockApiKey!,
                } satisfies BedrockApiKey);
          break;
        case AuthMethod.AccessKeys:
          if (!values.awsAccessKeyId && !values.awsSecretAccessKey) {
            secretKey = shouldPreserveExistingBedrockCredentials
              ? undefined
              : BEDROCK_USE_DEFAULT_CREDENTIALS;
          } else {
            secretKey = JSON.stringify({
              accessKeyId: values.awsAccessKeyId!,
              secretAccessKey: values.awsSecretAccessKey!,
            } satisfies BedrockAccessKeys);
          }
          break;
      }

      config = {
        region: values.awsRegion ?? "",
      };
    } else if (currentAdapter === LLMAdapter.VertexAI) {
      // Handle Vertex AI credentials
      // secretKey already contains either JSON key or VERTEXAI_USE_DEFAULT_CREDENTIALS sentinel
      if (mode === "update") {
        // In update mode, only update secretKey if a new one is provided
        if (values.secretKey) {
          secretKey = values.secretKey;
        } else {
          // Keep existing credentials by not setting secretKey
          secretKey = undefined;
        }
      }
      // In create mode, secretKey is already set from values.secretKey

      // Build config with location only (projectId removed for security - ADC auto-detects)
      const vertexAIConfig: VertexAIConfig = {};
      if (values.vertexAILocation?.trim()) {
        vertexAIConfig.location = values.vertexAILocation.trim();
      }
      // If config is empty, set to undefined
      config =
        Object.keys(vertexAIConfig).length > 0 ? vertexAIConfig : undefined;
    } else if (currentAdapter === LLMAdapter.OpenAI) {
      config =
        values.openAIUseResponsesApi || mode === "update"
          ? { useResponsesApi: values.openAIUseResponsesApi }
          : undefined;
    }

    const extraHeaders =
      values.extraHeaders.length > 0
        ? values.extraHeaders.reduce(
            (acc, header) => {
              acc[header.key] = header.value ?? "";
              return acc;
            },
            {} as Record<string, string>,
          )
        : undefined;

    const newLlmApiKey = {
      id: existingKey?.id ?? "",
      projectId,
      secretKey: secretKey ?? "",
      provider: values.provider,
      adapter: values.adapter,
      baseURL: values.baseURL || undefined,
      withDefaultModels: isCustomModelsRequired(currentAdapter)
        ? false
        : values.withDefaultModels,
      config,
      customModels: values.customModels
        .map((m) => m.value.trim())
        .filter(Boolean),
      extraHeaders,
    };

    try {
      const testResult =
        mode === "create"
          ? await mutTestLLMApiKey.mutateAsync(newLlmApiKey)
          : await mutTestUpdateLLMApiKey.mutateAsync(newLlmApiKey);

      if (!testResult.success) throw new Error(testResult.error);
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message:
          error instanceof Error
            ? error.message
            : "settingsMore:llm.verifyFailed",
      });

      return;
    }

    return (mode === "create" ? mutCreateLlmApiKey : mutUpdateLlmApiKey)
      .mutateAsync(newLlmApiKey)
      .then(() => {
        form.reset();
        onSuccess();
      })
      .catch((error) => reportNonTrpcError(error, "llm-api-keys"));
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4 overflow-auto"
        onSubmit={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent forms
          form.handleSubmit(onSubmit)(e);
        }}
      >
        <DialogBody>
          {/* LLM adapter */}
          <FormField
            control={form.control}
            name="adapter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("llm.adapter")}</FormLabel>
                <FormDescription>{t("llm.adapterHint")}</FormDescription>
                <Select
                  open={adapterSelectOpen}
                  onOpenChange={setAdapterSelectOpen}
                  value={showOtherModelInfo ? OTHER_MODEL_OPTION : field.value}
                  onValueChange={(value) => {
                    if (value === OTHER_MODEL_OPTION) {
                      setShowOtherModelInfo(true);
                      return;
                    }
                    setShowOtherModelInfo(false);
                    // Only reset the base URL when the adapter actually
                    // changes. Bouncing through the "other model" sentinel and
                    // back to the same adapter looks like a value change to
                    // Radix, but must not wipe a custom base URL the user
                    // already entered.
                    if (value !== field.value) {
                      form.setValue(
                        "baseURL",
                        getCustomizedBaseURL(value as LLMAdapter),
                      );
                    }
                    field.onChange(value as LLMAdapter);
                  }}
                  disabled={isFieldDisabled("adapter")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("llm.selectProvider")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {adapterOptions.map((provider) => (
                      <SelectItem value={provider} key={provider}>
                        {isDecisionModelAdapter(provider)
                          ? t("llm.experimental", { provider })
                          : provider}
                      </SelectItem>
                    ))}
                    {mode === "create" && (
                      <SelectItem value={OTHER_MODEL_OPTION}>
                        {t("llm.otherModel")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
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

          {showOtherModelInfo && (
            <div className="bg-muted/40 text-muted-foreground space-y-2 rounded-md border p-4 text-sm">
              <p>{t("llm.otherHint")}</p>
              <p>
                <a
                  href="https://langfuse.com/docs/administration/llm-connection#supported-providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {t("llm.providersDocs")}
                </a>
              </p>
            </div>
          )}

          {!showOtherModelInfo && (
            <>
              {/* Provider name */}
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("llm.providerName")}</FormLabel>
                    <FormDescription>{t("llm.providerHint")}</FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("llm.providerPlaceholder", {
                          adapter: currentAdapter,
                        })}
                        disabled={isFieldDisabled("provider")}
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

              {/* API Key or AWS Credentials or Vertex AI Credentials */}
              {currentAdapter === LLMAdapter.Bedrock ? (
                <>
                  <FormField
                    control={form.control}
                    name="authMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("llm.authMethod")}</FormLabel>
                        <FormDescription>
                          {t("llm.authMethodHint")}
                        </FormDescription>
                        <FormControl>
                          <div className="w-full">
                            <Tabs
                              value={field.value}
                              onValueChange={(value) =>
                                field.onChange(value as BedrockAuthMethod)
                              }
                            >
                              <Tabs.List layout="full" gap="sm" size="auto">
                                <Tabs.Trigger
                                  value={AuthMethod.AccessKeys}
                                  size="sm"
                                  label={t("llm.awsAccessKeys")}
                                />
                                <Tabs.Trigger
                                  value={AuthMethod.ApiKey}
                                  size="sm"
                                  label={t("llm.apiKeyLower")}
                                />
                              </Tabs.List>
                            </Tabs>
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
                  <FormField
                    control={form.control}
                    name="awsRegion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("llm.awsRegion")}</FormLabel>
                        <FormDescription>
                          {mode === "update" &&
                            existingKey?.config &&
                            (existingKey.config as BedrockConfig).region && (
                              <span className="text-sm">
                                <Trans
                                  t={t}
                                  i18nKey="llm.currentRegion"
                                  values={{
                                    region: (
                                      existingKey.config as BedrockConfig
                                    ).region,
                                  }}
                                  components={{
                                    code: (
                                      <code className="bg-muted rounded px-1 py-0.5" />
                                    ),
                                  }}
                                />
                              </span>
                            )}
                        </FormDescription>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              mode === "update" && existingKey?.config
                                ? ((existingKey.config as BedrockConfig)
                                    .region ?? "")
                                : t("llm.regionExample")
                            }
                            data-1p-ignore
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
                  {currentAuthMethod === AuthMethod.ApiKey && (
                    <FormField
                      control={form.control}
                      name="bedrockApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("llm.bedrockApiKey")}</FormLabel>
                          <FormDescription>
                            <Trans
                              t={t}
                              i18nKey={
                                mode === "update"
                                  ? "llm.bedrockKeyReplace"
                                  : "llm.bedrockKeyUse"
                              }
                              components={{
                                link: (
                                  <a
                                    href="https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                  />
                                ),
                              }}
                            />
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder={
                                mode === "update"
                                  ? isKeepingCurrentBedrockAuthMethod &&
                                    existingKey?.displaySecretKey
                                    ? t("llm.preservedUnlessReplaced", {
                                        key: existingKey.displaySecretKey,
                                      })
                                    : t("llm.enterBedrockKey")
                                  : undefined
                              }
                              autoComplete="new-password"
                              data-1p-ignore
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
                  )}
                  {currentAuthMethod === AuthMethod.AccessKeys && (
                    <>
                      <FormField
                        control={form.control}
                        name="awsAccessKeyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("llm.awsAccessKeyId")}
                              {!isLangfuseCloud && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  {t("common.optional")}
                                </span>
                              )}
                            </FormLabel>
                            <FormDescription>
                              {mode === "update"
                                ? isKeepingCurrentBedrockAuthMethod
                                  ? t("llm.keepCredentials")
                                  : t("llm.bothCredentials")
                                : isLangfuseCloud
                                  ? t("llm.awsLongLived")
                                  : t("llm.awsSelfHosted")}
                            </FormDescription>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={
                                  mode === "update"
                                    ? isUsingDefaultAwsCredentialsForCurrentAuthMethod
                                      ? t("llm.defaultAwsCredentials")
                                      : isKeepingCurrentBedrockAuthMethod
                                        ? t("llm.maskedCredentials")
                                        : t("llm.enterAwsAccessKey")
                                    : undefined
                                }
                                autoComplete="off"
                                data-1p-ignore
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
                        name="awsSecretAccessKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("llm.awsSecretKey")}
                              {!isLangfuseCloud && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  {t("common.optional")}
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder={
                                  mode === "update"
                                    ? isUsingDefaultAwsCredentialsForCurrentAuthMethod
                                      ? t("llm.defaultAwsCredentials")
                                      : isKeepingCurrentBedrockAuthMethod &&
                                          existingKey?.displaySecretKey
                                        ? t("llm.preservedIfEmpty", {
                                            key: existingKey.displaySecretKey,
                                          })
                                        : t("llm.enterAwsSecretKey")
                                    : undefined
                                }
                                autoComplete="new-password"
                                data-1p-ignore
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
                    </>
                  )}
                  {!isLangfuseCloud &&
                    currentAuthMethod === AuthMethod.AccessKeys && (
                      <div className="text-muted-foreground space-y-2 border-l-2 border-blue-200 pl-4 text-sm">
                        <p>
                          <strong>{t("llm.defaultChain")}</strong>{" "}
                          {t("llm.defaultAwsChainHint")}
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>{t("llm.awsEnvironment")}</li>
                          <li>{t("llm.awsCredentialsFile")}</li>
                          <li>{t("llm.ec2Role")}</li>
                          <li>{t("llm.ecsRole")}</li>
                        </ul>
                        <p>
                          <a
                            href="https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {t("llm.awsCredentialsDocs")}
                          </a>
                        </p>
                      </div>
                    )}
                </>
              ) : currentAdapter === LLMAdapter.VertexAI ? (
                <>
                  {/* Vertex AI ADC option for self-hosted only, create mode only */}
                  {!isLangfuseCloud && mode === "create" && (
                    <FormItem>
                      <span className="flex">
                        <span className="flex-1">
                          <FormLabel>{t("llm.useAdc")}</FormLabel>
                          <FormDescription>{t("llm.adcHint")}</FormDescription>
                        </span>
                        <FormControl>
                          <Switch
                            checked={
                              form.watch("secretKey") ===
                              VERTEXAI_USE_DEFAULT_CREDENTIALS
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue(
                                  "secretKey",
                                  VERTEXAI_USE_DEFAULT_CREDENTIALS,
                                );
                              } else {
                                form.setValue("secretKey", "");
                              }
                            }}
                          />
                        </FormControl>
                      </span>
                    </FormItem>
                  )}

                  {/* Service Account Key - hidden when ADC is enabled */}
                  {(isLangfuseCloud ||
                    form.watch("secretKey") !==
                      VERTEXAI_USE_DEFAULT_CREDENTIALS) && (
                    <FormField
                      control={form.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("llm.serviceAccountKey")}</FormLabel>
                          <FormDescription>
                            {isLangfuseCloud
                              ? t("llm.cloudKeyStorage")
                              : t("llm.selfHostedKeyStorage")}
                          </FormDescription>
                          <FormDescription className="text-dark-yellow">
                            {t("llm.serviceAccountHint")}
                            <pre className="text-xs">
                              {`{
  "type": "service_account",
  "project_id": "<project_id>",
  "private_key_id": "<private_key_id>",
  "private_key": "<private_key>",
  "client_email": "<client_email>",
  "client_id": "<client_id>",
  "auth_uri": "<auth_uri>",
  "token_uri": "<token_uri>",
  "auth_provider_x509_cert_url": "<auth_provider_x509_cert_url>",
  "client_x509_cert_url": "<client_x509_cert_url>",
}`}
                            </pre>
                          </FormDescription>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                mode === "update"
                                  ? existingKey?.displaySecretKey
                                  : '{"type": "service_account", ...}'
                              }
                              autoComplete="off"
                              spellCheck="false"
                              autoCapitalize="off"
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
                  )}

                  {/* ADC info box for self-hosted */}
                  {!isLangfuseCloud &&
                    form.watch("secretKey") ===
                      VERTEXAI_USE_DEFAULT_CREDENTIALS && (
                      <div className="text-muted-foreground space-y-2 border-l-2 border-blue-200 pl-4 text-sm">
                        <p>
                          <strong>{t("llm.adcTitle")}</strong>{" "}
                          {t("llm.gcpChainHint")}
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>{t("llm.gcpEnvironment")}</li>
                          <li>{t("llm.gcloudCredentials")}</li>
                          <li>{t("llm.gkeIdentity")}</li>
                          <li>{t("llm.cloudRunAccount")}</li>
                          <li>{t("llm.gceAccount")}</li>
                        </ul>
                        <p>
                          <a
                            href="https://cloud.google.com/docs/authentication/application-default-credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {t("llm.adcDocs")}
                          </a>
                        </p>
                      </div>
                    )}
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("llm.apiKey")}</FormLabel>
                      <FormDescription>
                        {isLangfuseCloud
                          ? t("llm.cloudKeyStorage")
                          : t("llm.selfHostedKeyStorage")}
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            mode === "update"
                              ? existingKey?.displaySecretKey
                              : undefined
                          }
                          autoComplete="off"
                          spellCheck="false"
                          autoCapitalize="off"
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
              )}

              {/* Azure Base URL - Always required for Azure */}
              {currentAdapter === LLMAdapter.Azure && (
                <FormField
                  control={form.control}
                  name="baseURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("llm.apiBaseUrl")}</FormLabel>
                      <FormDescription>
                        {t("llm.azureBaseHint")}
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://your-instance.openai.azure.com/openai/deployments"
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
              )}

              {/* Custom models: top-level for Azure/Bedrock */}
              {isCustomModelsRequired(currentAdapter) &&
                renderCustomModelsField()}

              {/* Extra headers - show for Azure in main section (Azure has no advanced settings) */}
              {currentAdapter === LLMAdapter.Azure && renderExtraHeadersField()}

              {hasAdvancedSettings(currentAdapter) && (
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="flex items-center pl-0"
                    onClick={() =>
                      setShowAdvancedSettings(!showAdvancedSettings)
                    }
                  >
                    <span>
                      {showAdvancedSettings
                        ? t("llm.hideAdvanced")
                        : t("llm.showAdvanced")}
                    </span>
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${showAdvancedSettings ? "rotate-180" : "rotate-0"}`}
                    />
                  </Button>
                </div>
              )}

              {hasAdvancedSettings(currentAdapter) && showAdvancedSettings && (
                <div className="space-y-4 border-t pt-4">
                  {/* baseURL */}
                  <FormField
                    control={form.control}
                    name="baseURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("llm.apiBaseUrl")}</FormLabel>
                        <FormDescription>
                          {t("llm.defaultBaseHint")}{" "}
                          {currentAdapter === LLMAdapter.OpenAI && (
                            <span>{t("llm.openaiDefault")}</span>
                          )}
                          {currentAdapter === LLMAdapter.Anthropic && (
                            <span>{t("llm.anthropicDefault")}</span>
                          )}
                        </FormDescription>

                        <FormControl>
                          <Input {...field} placeholder="default" />
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

                  {/* VertexAI Location */}
                  {currentAdapter === LLMAdapter.VertexAI && (
                    <FormField
                      control={form.control}
                      name="vertexAILocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("llm.location")}</FormLabel>
                          <FormDescription>
                            <Trans
                              t={t}
                              i18nKey="llm.locationHint"
                              components={{
                                code: <span className="font-bold" />,
                              }}
                            />
                          </FormDescription>
                          <FormControl>
                            <Input {...field} placeholder="global" />
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
                  )}

                  {/* OpenAI Responses API */}
                  {currentAdapter === LLMAdapter.OpenAI && (
                    <FormField
                      control={form.control}
                      name="openAIUseResponsesApi"
                      render={({ field }) => (
                        <FormItem>
                          <span className="flex">
                            <span className="flex-1">
                              <FormLabel>{t("llm.useResponses")}</FormLabel>
                              <FormDescription>
                                {t("llm.responsesHint")}
                              </FormDescription>
                            </span>

                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </span>

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

                  {/* Extra Headers */}
                  {[LLMAdapter.OpenAI, LLMAdapter.Anthropic].includes(
                    currentAdapter,
                  ) && renderExtraHeadersField()}

                  {/* With default models */}
                  <FormField
                    control={form.control}
                    name="withDefaultModels"
                    render={({ field }) => (
                      <FormItem>
                        <span className="flex">
                          <span className="flex-1">
                            <FormLabel>{t("llm.defaultModels")}</FormLabel>
                            <FormDescription>
                              {t("llm.defaultModelsHint")}
                            </FormDescription>
                          </span>

                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </span>

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

                  {/* Custom model names */}
                  {!isCustomModelsRequired(currentAdapter) &&
                    renderCustomModelsField()}
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <div className="flex min-w-0 flex-col gap-4">
            {showOtherModelInfo ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => setAdapterSelectOpen(true)}
              >
                {t("llm.selectAdapter")}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full"
                loading={form.formState.isSubmitting}
              >
                {mode === "create" ? t("llm.create") : t("llm.save")}
              </Button>
            )}
            {form.formState.errors.root && (
              <div className="max-h-32 overflow-y-auto">
                <FormMessage
                  translateError={(message) =>
                    typeof message === "string" &&
                    message.startsWith("settingsMore:")
                      ? t(message.slice("settingsMore:".length))
                      : undefined
                  }
                  className="break-words wrap-anywhere"
                >
                  {form.formState.errors.root.message?.startsWith(
                    "settingsMore:",
                  )
                    ? t(
                        form.formState.errors.root.message.slice(
                          "settingsMore:".length,
                        ),
                      )
                    : form.formState.errors.root.message}
                </FormMessage>
              </div>
            )}
          </div>
        </DialogFooter>
      </form>
    </Form>
  );
}
