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
import { api, reportTrpcErrorWithoutToast } from "@/src/utils/api";
import { useSession } from "next-auth/react";
import { projectNameSchema } from "@/src/features/auth";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";

export const NewProjectForm = ({
  orgId,
  onSuccess,
}: {
  orgId: string;
  onSuccess: (projectId: string) => void;
}) => {
  const { t } = useTranslation("settings");
  const capture = usePostHogClientCapture();
  const { update: updateSession } = useSession();

  const form = useForm({
    resolver: async (values, context, options) => {
      const result = await zodResolver(projectNameSchema)(
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
    },
  });
  const createProjectMutation = api.projects.create.useMutation({
    onSuccess: () => {
      updateSession();
    },
    onError: (error) => form.setError("name", { message: error.message }),
  });

  function onSubmit(values: z.infer<typeof projectNameSchema>) {
    capture("projects:new_form_submit");
    createProjectMutation
      .mutateAsync({
        name: values.name,
        orgId,
      })
      .then((project) => {
        onSuccess(project.id);
        form.reset();
      })
      .catch((error) => reportTrpcErrorWithoutToast(error, "projects"));
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3"
        data-testid="new-project-form"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
          }
        }}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("projectNameLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder="my-llm-project"
                  {...field}
                  data-testid="new-project-name-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" loading={createProjectMutation.isPending}>
          {t("create")}
        </Button>
      </form>
    </Form>
  );
};
