/* eslint-disable @repo/no-abstracted-overlay-trigger */
import { useRouter } from "next/router";
import { Button } from "@/src/components/ui/button";
import { api, reportNonTrpcError } from "@/src/utils/api";
import { Copy } from "lucide-react";
import { useHasProjectAccess } from "@/src/features/rbac";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { ActionButton } from "@/src/components/ActionButton";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import { useEntitlementLimit } from "@/src/features/entitlements";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/src/components/ui/input";
import { RadioGroup } from "@/src/components/design-system/RadioGroup/RadioGroup";
import { usePromptNameValidation } from "@/src/features/prompts/hooks/usePromptNameValidation";
import { useTranslation } from "react-i18next";

enum CopySettings {
  SINGLE_VERSION = "single_version",
  ALL_VERSIONS = "all_versions",
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isCopySingleVersion: z.enum(CopySettings),
});

const DuplicatePromptForm: React.FC<{
  projectId: string;
  promptId: string;
  promptName: string;
  promptVersion: number;
  onFormSuccess: () => void;
}> = ({ projectId, promptId, promptName, promptVersion, onFormSuccess }) => {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const capture = usePostHogClientCapture();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: promptName + "-copy",
      isCopySingleVersion: CopySettings.SINGLE_VERSION,
    },
  });

  const currentName = form.watch("name");

  const utils = api.useUtils();
  const duplicatePrompt = api.prompts.duplicatePrompt.useMutation({
    onSuccess: ({ name }) => {
      utils.prompts.invalidate();
      router.push(`/project/${projectId}/prompts/${encodeURIComponent(name)}`);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    capture("prompt_detail:duplicate_form_submit");
    duplicatePrompt
      .mutateAsync({
        ...values,
        projectId: projectId,
        promptId: promptId,
        isSingleVersion:
          values.isCopySingleVersion === CopySettings.SINGLE_VERSION,
      })
      .then(() => {
        onFormSuccess();
        form.reset();
      })
      .catch((error) => reportNonTrpcError(error, "prompts"));
  }

  const allPrompts = api.prompts.filterOptions.useQuery(
    {
      projectId: projectId,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  ).data?.name;

  usePromptNameValidation({
    currentName,
    allPrompts,
    form,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-1 flex-col gap-4"
      >
        <DialogBody>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>{tFeatures("ui.name")}</FormLabel>
                <FormControl>
                  <Input {...field} type="text" />
                </FormControl>
                <FormMessage
                  translateError={(message) =>
                    message === "prompts.validation.nameExists"
                      ? tMore("prompts.validation.nameExists")
                      : undefined
                  }
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isCopySingleVersion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tFeatures("ui.settings")}</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormItem className="flex items-center space-y-0 space-x-3">
                      <FormControl>
                        <RadioGroup.Item value={CopySettings.SINGLE_VERSION} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {tMore("prompts.copyVersion", {
                          version: promptVersion,
                        })}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-y-0 space-x-3">
                      <FormControl>
                        <RadioGroup.Item value={CopySettings.ALL_VERSIONS} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {tFeatures("ui.copyAllPromptVersionsAndLabels")}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage
                  translateError={(message) =>
                    message === "prompts.validation.nameExists"
                      ? tMore("prompts.validation.nameExists")
                      : undefined
                  }
                />
              </FormItem>
            )}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            type="submit"
            loading={duplicatePrompt.isPending}
            className="mt-auto w-full"
          >
            {tFeatures("ui.submit")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export const DuplicatePromptButton: React.FC<{
  projectId: string;
  promptId: string;
  promptName: string;
  promptVersion: number;
}> = ({ projectId, promptId, promptName, promptVersion }) => {
  const { t: tFeatures } = useTranslation("features");
  const [open, setOpen] = useState(false);
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "prompts:CUD",
  });
  const promptLimit = useEntitlementLimit("prompt-management-count-prompts");

  const allPromptNames = api.prompts.allNames.useQuery(
    {
      projectId,
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: hasAccess,
    },
  );

  return (
    <Dialog open={hasAccess && open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton
          icon={<Copy className="h-4 w-4" aria-hidden="true" />}
          hasAccess={hasAccess}
          trackingEventName="prompt_detail:duplicate_button_click"
          variant="outline"
          title={tFeatures("ui.duplicatePrompt")}
          usageLimit={
            typeof promptLimit === "number"
              ? {
                  current: allPromptNames.data?.length ?? undefined,
                  max: promptLimit,
                }
              : undefined
          }
        >
          <span className="hidden md:ml-1 md:inline">
            {tFeatures("ui.duplicate")}
          </span>
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] min-h-0">
        <DialogHeader>
          <DialogTitle>{tFeatures("ui.duplicatePrompt")}</DialogTitle>
        </DialogHeader>
        <DuplicatePromptForm
          projectId={projectId}
          promptId={promptId}
          promptName={promptName}
          promptVersion={promptVersion}
          onFormSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
