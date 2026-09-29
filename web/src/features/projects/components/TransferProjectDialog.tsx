import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/src/components/design-system/Alert/Alert";
import { Dialog } from "@/src/components/design-system/Dialog/Dialog";
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
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
import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type TransferProjectDialogOrganization = {
  id: string;
  name: string;
};

export interface TransferProjectDialogProps {
  projectName: string;
  organizationName: string;
  organizations: TransferProjectDialogOrganization[];
  isPending: boolean;
  onConfirm: (organizationId: string) => void;
}

export function TransferProjectDialog({
  projectName,
  organizationName,
  organizations,
  isPending,
  onConfirm,
}: TransferProjectDialogProps) {
  const { t } = useTranslation("settings");
  const formId = useId();
  const confirmMessage = `${organizationName}/${projectName}`
    .replaceAll(" ", "-")
    .toLowerCase();
  const formSchema = z.object({
    name: z.string().includes(confirmMessage, {
      message: t("confirmWith", { value: confirmMessage }),
    }),
    organizationId: z.string().min(1, {
      message: t("organizationRequired"),
    }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      organizationId: "",
    },
  });

  return (
    <Dialog
      title={t("transferProject")}
      actions={[
        {
          label: t("transferProjectAction"),
          type: "submit",
          form: formId,
          variant: "destructive",
          loading: isPending,
          disabled: organizations.length === 0,
        },
      ]}
    >
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(({ organizationId }) =>
            onConfirm(organizationId),
          )}
        >
          <Dialog.Body>
            <Alert variant="warning" icon={TriangleAlert}>
              <Alert.Title>{t("warning")}</Alert.Title>
              <Alert.Description>
                {t("transferWarning")}
                <ul className="list-disc pl-4">
                  <li>{t("transferMembersWarning")}</li>
                  <li>{t("transferUnchanged")}</li>
                </ul>
              </Alert.Description>
            </Alert>
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("selectNewOrganization")}</FormLabel>
                  <FormControl>
                    <SelectInput
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                      placeholder={t("selectOrganization")}
                      emptyMessage={t("noTransferOrganizations")}
                      options={organizations.map((organization) => ({
                        value: organization.id,
                        label: organization.name,
                      }))}
                    />
                  </FormControl>
                  <FormDescription>{t("transferDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirm")}</FormLabel>
                  <FormControl>
                    <Input placeholder={confirmMessage} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("typeConfirmation", { value: confirmMessage })}
                  </FormDescription>
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
