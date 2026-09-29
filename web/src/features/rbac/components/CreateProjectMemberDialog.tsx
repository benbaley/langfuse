import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Role } from "@langfuse/shared";
import { useId } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Dialog } from "@/src/components/design-system/Dialog/Dialog";
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
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RoleSelectItem } from "@/src/features/rbac/components/RoleSelectItem";
import { reportTrpcErrorWithoutToast } from "@/src/utils/api";

const roleValues = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
  NONE: "NONE",
} as const satisfies Record<Role, Role>;

const formSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  orgRole: z.enum(roleValues),
  projectRole: z.enum(roleValues),
});

type FormValues = z.infer<typeof formSchema>;

type CreateProjectMemberDialogProps = {
  project: { id: string; name: string } | undefined;
  hasOnlySingleProjectAccess: boolean;
  hasProjectRoleEntitlement: boolean;
  isPending: boolean;
  createProjectMember: (values: FormValues) => Promise<void>;
  onSuccess: () => void;
};

export function CreateProjectMemberDialog({
  project,
  hasOnlySingleProjectAccess,
  hasProjectRoleEntitlement,
  isPending,
  createProjectMember,
  onSuccess,
}: CreateProjectMemberDialogProps) {
  const { t } = useTranslation("settings");
  const formId = useId();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      orgRole: hasOnlySingleProjectAccess ? roleValues.NONE : roleValues.MEMBER,
      projectRole: hasOnlySingleProjectAccess
        ? roleValues.MEMBER
        : roleValues.NONE,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createProjectMember(values);
      form.reset();
      onSuccess();
    } catch (error) {
      form.setError("email", {
        type: "manual",
        message:
          error instanceof Error ? error.message : "Failed to add member",
      });
      reportTrpcErrorWithoutToast(error, "members");
    }
  }

  return (
    <Dialog
      actions={[
        {
          label: t("grantAccess"),
          type: "submit",
          form: formId,
          loading: isPending,
        },
      ]}
      title={t(
        hasOnlySingleProjectAccess
          ? "addProjectMember"
          : "addOrganizationMember",
      )}
    >
      <Form {...form}>
        <form
          id={formId}
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Dialog.Body>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input placeholder="jsdoe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!hasOnlySingleProjectAccess && (
              <FormField
                control={form.control}
                name="orgRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("organizationRole")}</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(value) =>
                        field.onChange(
                          value as (typeof roleValues)[keyof typeof roleValues],
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("selectOrganizationRole")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(roleValues).map((role) => (
                          <RoleSelectItem role={role} key={role} />
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {project !== undefined && hasProjectRoleEntitlement && (
              <FormField
                control={form.control}
                name="projectRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("projectRole")}</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(value) =>
                        field.onChange(
                          value as (typeof roleValues)[keyof typeof roleValues],
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectProjectRole")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(roleValues)
                          .filter(
                            (role) =>
                              !hasOnlySingleProjectAccess ||
                              role !== roleValues.NONE,
                          )
                          .map((role) => (
                            <RoleSelectItem
                              role={role}
                              key={role}
                              isProjectRole
                            />
                          ))}
                      </SelectContent>
                    </Select>
                    {!hasOnlySingleProjectAccess && (
                      <FormDescription>
                        {t("projectRoleDescription")} ({project.name}).
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </Dialog.Body>
        </form>
      </Form>
    </Dialog>
  );
}
