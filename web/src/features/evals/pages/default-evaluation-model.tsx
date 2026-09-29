import Page from "@/src/components/layouts/page";
import { useRouter } from "next/router";
import { useHasProjectAccess } from "@/src/features/rbac";
import { SupportOrUpgradePage } from "@/src/ee/features/billing";
import { DefaultEvalModelSetup } from "@/src/features/evals/components/default-eval-model-setup";
import { useTranslation } from "react-i18next";

export default function DefaultEvaluationModelPage() {
  const { t: tFeatures } = useTranslation("features");
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const hasReadAccess = useHasProjectAccess({
    projectId,
    scope: "evalDefaultModel:read",
  });

  if (!hasReadAccess) {
    return <SupportOrUpgradePage />;
  }

  return (
    <Page
      withPadding
      headerProps={{
        title: tFeatures("ui.defaultEvaluationModel"),
        help: {
          description: "Configure a default evaluation model for your project.",
          href: "https://langfuse.com/docs/evaluation/evaluation-methods/llm-as-a-judge",
        },
        breadcrumb: [
          {
            name: "Evaluator Library",
            href: `/project/${projectId}/evals/templates`,
          },
        ],
      }}
    >
      <DefaultEvalModelSetup projectId={projectId} />
    </Page>
  );
}
