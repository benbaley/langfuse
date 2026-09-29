import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import { SplashScreen } from "@/src/components/ui/splash-screen";
import { Braces, Code, ListTree, Upload } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { CsvUploadDialog } from "@/src/features/datasets/components/CsvUploadDialog";
import { NewDatasetItemForm } from "@/src/features/datasets/components/NewDatasetItemForm";
import { useHasProjectAccess } from "@/src/features/rbac";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import { cn } from "@/src/utils/tailwind";

interface DatasetItemEntryPointRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  hasAccess?: boolean;
}

const DatasetItemEntryPointRow = ({
  icon,
  title,
  description,
  onClick,
  hasAccess = true,
}: DatasetItemEntryPointRowProps) => {
  const { t: tFeatures } = useTranslation("features");

  const disabled = !hasAccess;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      className={cn(
        "border-border flex h-20 items-center gap-4 rounded-lg border p-4 transition-colors",
        disabled
          ? "bg-muted text-muted-foreground opacity-60"
          : "bg-card hover:bg-accent/50 cursor-pointer",
      )}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={
        !disabled
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      title={
        !hasAccess ? tFeatures("evalsMore:onboarding.noAccess") : undefined
      }
    >
      <div className="flex items-center">{icon}</div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-bold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
};

export const DatasetItemsOnboarding = ({
  projectId,
  datasetId,
}: {
  projectId: string;
  datasetId: string;
}) => {
  const { t: tFeatures } = useTranslation("features");

  const capture = usePostHogClientCapture();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const submissionPending = useRef(false);

  const hasProjectAccess = useHasProjectAccess({
    projectId,
    scope: "datasets:CUD",
  });

  return (
    <SplashScreen
      title={tFeatures("evalsMore:onboarding.itemsTitle")}
      description={tFeatures("evalsMore:onboarding.itemsDescription")}
    >
      <div className="flex flex-col gap-4">
        <CsvUploadDialog
          open={hasProjectAccess && isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          projectId={projectId}
          datasetId={datasetId}
        >
          <DialogTrigger asChild disabled={!hasProjectAccess}>
            <DatasetItemEntryPointRow
              icon={<Upload className="h-5 w-5" />}
              title={tFeatures("evalsMore:onboarding.itemsUpload")}
              description={tFeatures("evalsMore:onboarding.itemsUploadHelp")}
              onClick={() => {
                if (hasProjectAccess) {
                  capture("dataset_item:upload_csv_button_click");
                }
              }}
              hasAccess={hasProjectAccess}
            />
          </DialogTrigger>
        </CsvUploadDialog>

        <Dialog
          open={hasProjectAccess && isNewItemDialogOpen}
          onOpenChange={(open) => {
            if (!submissionPending.current) setIsNewItemDialogOpen(open);
          }}
        >
          <DialogTrigger asChild disabled={!hasProjectAccess}>
            <DatasetItemEntryPointRow
              icon={<Braces className="h-5 w-5" />}
              title={tFeatures("evalsMore:onboarding.itemsManual")}
              description={tFeatures("evalsMore:onboarding.itemsManualHelp")}
              onClick={() => {
                if (hasProjectAccess) {
                  capture("dataset_item:new_form_open");
                }
              }}
              hasAccess={hasProjectAccess}
            />
          </DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>
                {tFeatures("evalsMore:onboarding.createItem")}
              </DialogTitle>
            </DialogHeader>
            <NewDatasetItemForm
              projectId={projectId}
              datasetId={datasetId}
              onPendingChange={(pending) => {
                submissionPending.current = pending;
              }}
              onFormSuccess={() => setIsNewItemDialogOpen(false)}
              className="h-full overflow-y-auto"
            />
          </DialogContent>
        </Dialog>

        <Link
          href="https://langfuse.com/docs/evaluation/experiments/datasets#create-items-from-production-data"
          target="_blank"
        >
          <DatasetItemEntryPointRow
            icon={<Code className="h-5 w-5" />}
            title={tFeatures("evalsMore:onboarding.itemsCode")}
            description={tFeatures("evalsMore:onboarding.itemsCodeHelp")}
          />
        </Link>

        <Link href={`/project/${projectId}/observations`}>
          <DatasetItemEntryPointRow
            icon={<ListTree className="h-5 w-5" />}
            title={tFeatures("evalsMore:onboarding.itemsObservations")}
            description={tFeatures(
              "evalsMore:onboarding.itemsObservationsHelp",
            )}
            onClick={() => {
              capture("dataset_item:select_observations_button_click");
            }}
          />
        </Link>
      </div>
    </SplashScreen>
  );
};
