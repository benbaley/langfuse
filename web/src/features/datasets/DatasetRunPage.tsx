import { Button } from "@/src/components/ui/button";
import { JSONView } from "@/src/components/ui/CodeJsonViewer";
import { DatasetRunItemsByRunTable } from "@/src/features/datasets/components/DatasetRunItemsByRunTable";
import { DeleteDatasetRunDialogController } from "@/src/features/datasets/components/DeleteDatasetRunDialogController";
import { DetailPageNav } from "@/src/features/navigate-detail-pages";
import { api } from "@/src/utils/api";
import { Columns3, MoreVertical, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Page from "@/src/components/layouts/page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  SidePanel,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
} from "@/src/components/ui/side-panel";
import { Skeleton } from "@/src/components/ui/skeleton";
import { getDatasetBreadcrumb } from "@/src/features/datasets/utils/getDatasetBreadcrumb";
import {
  useExperimentAccess,
  singleRunToExperimentsUrl,
} from "@/src/features/experiments";
import { buildLocalIsoDatePresentation } from "@/src/utils/dates";
import { useTranslation } from "react-i18next";

function DatasetRunLegacy() {
  const { t: tFeatures } = useTranslation("features");
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const datasetId = router.query.datasetId as string;
  const runId = router.query.runId as string;

  const dataset = api.datasets.byId.useQuery({
    datasetId,
    projectId,
  });
  const run = api.datasets.runById.useQuery({
    datasetId,
    projectId,
    runId,
  });
  const breadcrumb = getDatasetBreadcrumb(
    projectId,
    datasetId,
    dataset.data?.name,
  );

  const preparedDate = buildLocalIsoDatePresentation({
    date: run.data?.datasetVersion,
  });

  return (
    <Page
      headerProps={{
        title: run.data?.name ?? runId,
        itemType: "EXPERIMENT",
        breadcrumb: [
          ...breadcrumb,
          {
            name: "Experiments",
            href: `/project/${projectId}/datasets/${datasetId}/experiments`,
          },
        ],
        actionButtonsRight: (
          <>
            <Link
              href={{
                pathname: `/project/${projectId}/datasets/${datasetId}/compare`,
                query: { runs: [runId] },
              }}
            >
              <Button>
                <Columns3 className="mr-2 h-4 w-4" />
                <span>{tFeatures("ui.compare")}</span>
              </Button>
            </Link>
            <DetailPageNav
              currentId={runId}
              path={(entry) =>
                `/project/${projectId}/datasets/${datasetId}/runs/${entry.id}`
              }
              listKey="datasetRuns"
            />
            <DeleteDatasetRunDialogController
              projectId={projectId}
              datasetRunId={runId}
              datasetId={datasetId}
              redirectUrl={`/project/${projectId}/datasets/${datasetId}/experiments`}
            >
              {({ disabled, openDialog }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem disabled={disabled} onSelect={openDialog}>
                      <Trash className="h-4 w-4" />
                      <span>{tFeatures("ui.delete")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </DeleteDatasetRunDialogController>
          </>
        ),
      }}
    >
      <div className="grid flex-1 grid-cols-[1fr_auto] overflow-hidden">
        <div className="flex h-full flex-col overflow-hidden">
          <DatasetRunItemsByRunTable
            projectId={projectId}
            datasetId={datasetId}
            datasetRunId={runId}
            datasetVersion={run.data?.datasetVersion}
          />
        </div>
        <SidePanel
          mobileTitle="Experiment run details"
          id="experiment-run-details"
        >
          <SidePanelHeader>
            <SidePanelTitle>
              {tFeatures("ui.experimentRunDetails")}
            </SidePanelTitle>
          </SidePanelHeader>
          <SidePanelContent>
            {run.isPending ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <>
                {run.data?.datasetVersion && preparedDate && (
                  <div className="flex flex-col gap-2 p-1">
                    <span className="text-sm font-bold">
                      {tFeatures("ui.datasetVersion")}
                    </span>
                    <Link
                      href={`/project/${projectId}/datasets/${datasetId}/items?version=${run.data.datasetVersion.toISOString()}`}
                      className="text-link hover:text-link-hover text-sm"
                    >
                      <span title={preparedDate.title}>
                        {preparedDate.display}
                      </span>
                    </Link>
                  </div>
                )}
                {!!run.data?.description && (
                  <JSONView
                    json={run.data.description}
                    title={tFeatures("ui.description")}
                    className="w-full overflow-y-auto"
                  />
                )}
                {!!run.data?.metadata && (
                  <JSONView
                    json={run.data.metadata}
                    title={tFeatures("ui.metadata")}
                    className="w-full overflow-y-auto"
                  />
                )}
                {!run.data?.description && !run.data?.metadata && (
                  <div className="text-muted-foreground mt-1 px-1 text-sm">
                    {tFeatures("ui.noDescriptionOrMetadataForThisRun")}
                  </div>
                )}
              </>
            )}
          </SidePanelContent>
        </SidePanel>
      </div>
    </Page>
  );
}

export default function DatasetRunPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const runId = router.query.runId as string;
  const { isExperimentsBetaActive, isInitializing } = useExperimentAccess();

  useEffect(() => {
    if (
      !router.isReady ||
      isInitializing ||
      !isExperimentsBetaActive ||
      !projectId ||
      !runId
    ) {
      return;
    }

    router.replace(singleRunToExperimentsUrl(projectId, runId));
  }, [isExperimentsBetaActive, isInitializing, projectId, router, runId]);

  if (!router.isReady || isInitializing || isExperimentsBetaActive) {
    return <Skeleton className="h-full w-full" />;
  }

  return <DatasetRunLegacy />;
}
