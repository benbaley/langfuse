import { useTranslation } from "react-i18next";
import { Button } from "@/src/components/ui/button";
import type * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { organizationFormSchema } from "@/src/features/organizations/utils/organizationNameSchema";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { ExternalLink } from "lucide-react";

export const NewOrganizationForm = ({
  isLangfuseCloud,
  onSubmit,
}: {
  isLangfuseCloud: boolean;
  onSubmit: (values: z.infer<typeof organizationFormSchema>) => Promise<void>;
}) => {
  const { t } = useTranslation("settings");
  const form = useForm({
    resolver: async (values, context, options) => {
      const result = await zodResolver(organizationFormSchema)(
        values,
        context,
        options,
      );
      const error = result.errors.name;
      if (error?.message) {
        const translationKeys: Record<string, string> = {
          "Must have at least 3 characters": "nameMinimum",
          "Must have at most 60 characters": "nameMaximum",
          "Text cannot contain HTML tags": "noHtml",
        };
        const key = translationKeys[error.message];
        if (key) error.message = t(key);
      }
      return result;
    },
    defaultValues: {
      name: "",
      aiFeaturesEnabled: true,
    },
  });

  async function handleSubmit(values: z.infer<typeof organizationFormSchema>) {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      form.setError("name", {
        message:
          error instanceof Error
            ? error.message
            : t("createOrganizationFailed"),
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-3"
        data-testid="new-org-form"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            form.handleSubmit(handleSubmit)();
          }
        }}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("organizationNameLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="my-org"
                  {...field}
                  data-testid="new-org-name-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="aiFeaturesEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start justify-between gap-4 rounded-md border p-3">
              <div className="flex flex-col gap-1">
                <FormLabel>{t("newOrgAiFeatures")}</FormLabel>
                <p className="text-muted-foreground text-sm">
                  {isLangfuseCloud
                    ? t("newOrgAiCloudDescription")
                    : t("newOrgAiSelfHostedDescription")}{" "}
                  {isLangfuseCloud && (
                    <a
                      href="https://langfuse.com/security/ai-features"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      {t("learnMore")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={t("newOrgAiFeatures")}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" loading={form.formState.isSubmitting}>
          {t("create")}
        </Button>
      </form>
    </Form>
  );
};
