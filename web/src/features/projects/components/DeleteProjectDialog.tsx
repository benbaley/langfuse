import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Dialog } from "@/src/components/design-system/Dialog/Dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";

type DeleteProjectForm = {
  name: string;
};

export type DeleteProjectDialogProps = {
  confirmMessage: string;
  isPending: boolean;
  onSubmit: () => void;
};

export function DeleteProjectDialog(props: DeleteProjectDialogProps) {
  const { t } = useTranslation("settings");
  const formId = useId();
  const formSchema = z.object({
    name: z.string().includes(props.confirmMessage, {
      message: t("confirmWith", { value: props.confirmMessage }),
    }),
  });

  const form = useForm<DeleteProjectForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  return (
    <Dialog
      title={t("deleteProject")}
      actions={[
        {
          label: t("deleteProjectAction"),
          type: "submit",
          form: formId,
          variant: "destructive",
          loading: props.isPending,
        },
      ]}
    >
      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(props.onSubmit)}>
          <Dialog.Body>
            <p>{t("typeConfirmation", { value: props.confirmMessage })}</p>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder={props.confirmMessage} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Dialog.Body>
        </form>
      </Form>
    </Dialog>
  );
}
