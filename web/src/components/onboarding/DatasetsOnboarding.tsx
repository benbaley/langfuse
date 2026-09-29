import { useTranslation } from "react-i18next";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { ButtonWithIcon } from "@/src/components/ButtonWithIcon";
import { DialogTrigger } from "@/src/components/ui/dialog";
import { CreateDatasetDialogController } from "@/src/features/datasets/components/CreateDatasetDialogController";
import { Database, Beaker, Zap, Code, LockIcon, PlusIcon } from "lucide-react";

export function DatasetsOnboarding({ projectId }: { projectId: string }) {
  const { t: tFeatures } = useTranslation("features");

  const valuePropositions: ValueProposition[] = [
    {
      title: tFeatures("evalsMore:onboarding.datasetsImprove"),
      description: tFeatures("evalsMore:onboarding.datasetsImproveHelp"),
      icon: Zap,
    },
    {
      title: tFeatures("evalsMore:onboarding.datasetsPreDeploy"),
      description: tFeatures("evalsMore:onboarding.datasetsPreDeployHelp"),
      icon: Beaker,
    },
    {
      title: tFeatures("evalsMore:onboarding.datasetsStructured"),
      description: tFeatures("evalsMore:onboarding.datasetsStructuredHelp"),
      icon: Database,
    },
    {
      title: tFeatures("evalsMore:onboarding.datasetsWorkflows"),
      description: tFeatures("evalsMore:onboarding.datasetsWorkflowsHelp"),
      icon: Code,
    },
  ];

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.datasetsTitle")}
      description={tFeatures("evalsMore:onboarding.datasetsDescription")}
      valuePropositions={valuePropositions}
      primaryAction={{
        label: tFeatures("evalsMore:onboarding.createDataset"),
        component: (
          <CreateDatasetDialogController
            projectId={projectId}
            target={{ type: "root" }}
          >
            {({ disabled, openDialog }) => (
              <DialogTrigger asChild>
                <ButtonWithIcon
                  size="lg"
                  disabled={disabled !== undefined}
                  onClick={openDialog}
                  variant="default"
                  icon={disabled === undefined ? PlusIcon : LockIcon}
                  text={tFeatures("evalsMore:onboarding.newDataset")}
                />
              </DialogTrigger>
            )}
          </CreateDatasetDialogController>
        ),
      }}
      secondaryAction={{
        label: tFeatures("evalsMore:onboarding.learnMore"),
        href: "https://langfuse.com/docs/datasets",
      }}
      videoSrc="https://static.langfuse.com/prod-assets/onboarding/datasets-overview-v1.mp4"
    />
  );
}
