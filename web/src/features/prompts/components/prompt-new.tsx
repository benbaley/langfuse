import { StringParam, useQueryParam } from "use-query-params";
import { NewPromptForm } from "@/src/features/prompts/components/NewPromptForm";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { api } from "@/src/utils/api";
import Page from "@/src/components/layouts/page";
import { useTranslation } from "react-i18next";

export const NewPrompt = () => {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const projectId = useProjectIdFromURL();
  const [initialPromptId] = useQueryParam("promptId", StringParam);

  const { data: initialPrompt, isLoading } = api.prompts.byId.useQuery(
    {
      projectId: projectId as string, // Typecast as query is enabled only when projectId is present
      id: initialPromptId ?? "",
    },
    {
      enabled: Boolean(initialPromptId && projectId),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  if (isLoading) {
    return <div className="p-3">{tFeatures("ui.loading")}</div>;
  }

  const breadcrumb: { name: string; href?: string }[] = [
    {
      name: "Prompts",
      href: `/project/${projectId}/prompts/`,
    },
    {
      name: "New prompt",
    },
  ];

  if (initialPrompt) {
    breadcrumb.pop(); // Remove "New prompt"
    breadcrumb.push(
      {
        name: initialPrompt.name,
        href: `/project/${projectId}/prompts/${encodeURIComponent(initialPrompt.name)}`,
      },
      { name: "New version" },
    );
  }

  return (
    <Page
      withPadding
      scrollable
      headerProps={{
        title: initialPrompt
          ? `${initialPrompt.name} \u2014 New version`
          : "Create new prompt",
        help: {
          description: tMore("prompts.managementHelp"),
          href: "https://langfuse.com/docs/prompts",
        },
        breadcrumb: breadcrumb,
      }}
    >
      {initialPrompt ? (
        <p className="text-muted-foreground text-sm">
          {tFeatures(
            "ui.promptsAreImmutableInLangfuseToUpdateAPromptCreateANewVersion",
          )}
        </p>
      ) : null}
      <div className="my-8">
        <NewPromptForm {...{ initialPrompt }} />
      </div>
    </Page>
  );
};
