import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import Header from "@/src/components/layouts/header";
import { ApiKeyList } from "@/src/features/public-api/components/ApiKeyList";
import { DeleteProjectDialogController } from "@/src/features/projects/components/DeleteProjectDialogController";
import { HostNameProject } from "@/src/features/projects/components/HostNameProject";
import RenameProject from "@/src/features/projects/components/RenameProject";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { LlmApiKeyList } from "@/src/features/public-api/components/LLMApiKeyList";
import { PagedSettingsContainer } from "@/src/components/PagedSettingsContainer";
import { useQueryProject } from "@/src/features/projects/hooks";
import { ConnectedMembershipInvitesSettingsTable } from "@/src/features/rbac/components/MembershipInvitesSettingsTable/ConnectedMembershipInvitesSettingsTable";
import { ConnectedMembersSettingsTable } from "@/src/features/rbac/components/MembersSettingsTable/ConnectedMembersSettingsTable";
import {
  useHasProjectAccess,
  useHasOrganizationAccess,
} from "@/src/features/rbac";
import { JSONView } from "@/src/components/ui/CodeJsonViewer";
import { PostHogLogo } from "@/src/components/PosthogLogo";
import { MixpanelLogo } from "@/src/components/MixpanelLogo";
import { Card } from "@/src/components/ui/card";
import { TransferProjectDialogController } from "@/src/features/projects/components/TransferProjectDialogController";
import { useHasEntitlement } from "@/src/features/entitlements";
import { useRouter } from "next/router";
import { SettingsDangerZone } from "@/src/components/SettingsDangerZone";
import { ActionButton } from "@/src/components/ActionButton";
import { BatchExportsSettingsPage } from "@/src/features/batch-exports";
import { BatchActionsSettingsPage } from "@/src/features/batch-actions";
import { AuditLogsSettingsPage } from "@/src/ee/features/audit-log-viewer";
import { ModelsSettings } from "@/src/features/models";
import ConfigureRetention from "@/src/features/projects/components/ConfigureRetention";
import ContainerPage from "@/src/components/layouts/container-page";
import { NoDataOrLoading } from "@/src/components/NoDataOrLoading";
import { ProtectedLabelsSettings } from "@/src/features/prompts";
import { SiSlack } from "react-icons/si";
import { ScoreConfigSettings } from "@/src/features/score-configs";
import { env } from "@/src/env.mjs";
import { PersonalNotificationSettings } from "@/src/features/notifications/components/PersonalNotificationSettings";
import { ProjectNotificationChannels } from "@/src/features/notifications/components/ProjectNotificationChannels";
import useSessionStorage from "@/src/components/useSessionStorage";
import { WebCalloutIntegrationCard } from "@/src/features/web-callouts";
import { DeveloperToolsSettings } from "@/src/features/developer-tools";
import { useV4UpgradeUiFlag } from "@/src/features/v4-migration/useV4UpgradeUiEnabled";
import { api } from "@/src/utils/api";

type ProjectSettingsPageEntry = {
  title: string;
  slug: string;
  show?: boolean | (() => boolean);
  cmdKKeywords?: string[];
} & ({ content: React.ReactNode } | { href: string });

export function useProjectSettingsPages(): ProjectSettingsPageEntry[] {
  const { t } = useTranslation("settings");
  const router = useRouter();
  const { project, organization } = useQueryProject();
  const showBillingSettings = useHasEntitlement("cloud-billing");
  const showRetentionSettings = useHasEntitlement("data-retention");
  const showProtectedLabelsSettings = useHasEntitlement(
    "prompt-protected-labels",
  );
  const showProjectNotificationChannels = useHasProjectAccess({
    projectId: project?.id,
    scope: "automations:CUD",
  });
  const showScoreConfigSettings = useHasProjectAccess({
    projectId: project?.id,
    scope: "scoreConfigs:read",
  });
  const showV4Migration = useV4UpgradeUiFlag();
  if (!project || !organization || !router.query.projectId) {
    return [];
  }

  return getProjectSettingsPages({
    t,
    project,
    organization,
    showBillingSettings,
    showRetentionSettings,
    showLLMConnectionsSettings: true,
    showProtectedLabelsSettings,
    showProjectNotificationChannels,
    showScoreConfigSettings,
    showV4Migration,
  });
}

const getProjectSettingsPages = ({
  t,
  project,
  organization,
  showBillingSettings,
  showRetentionSettings,
  showLLMConnectionsSettings,
  showProtectedLabelsSettings,
  showProjectNotificationChannels,
  showScoreConfigSettings,
  showV4Migration,
}: {
  t: TFunction<"settings">;
  project: { id: string; name: string; metadata: Record<string, unknown> };
  organization: { id: string; name: string; metadata: Record<string, unknown> };
  showBillingSettings: boolean;
  showRetentionSettings: boolean;
  showLLMConnectionsSettings: boolean;
  showProtectedLabelsSettings: boolean;
  showProjectNotificationChannels: boolean;
  showScoreConfigSettings: boolean;
  showV4Migration: boolean;
}): ProjectSettingsPageEntry[] => [
  {
    title: t("general"),
    slug: "index",
    cmdKKeywords: ["name", "id", "delete", "transfer", "ownership"],
    content: (
      <div className="flex flex-col gap-6">
        <HostNameProject />
        <RenameProject />
        {showRetentionSettings && <ConfigureRetention />}
        <div>
          <Header title={t("debugInformation")} />
          <JSONView
            title={t("metadata")}
            json={{
              project: {
                name: project.name,
                id: project.id,
                ...project.metadata,
              },
              org: {
                name: organization.name,
                id: organization.id,
                ...organization.metadata,
              },
              ...(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION && {
                cloudRegion: env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION,
              }),
            }}
          />
        </div>
        <SettingsDangerZone
          items={[
            {
              title: t("transferOwnership"),
              description: t("transferDescription"),
              button: (
                <TransferProjectDialogController
                  project={project}
                  organization={organization}
                >
                  {({ disabled, openDialog }) => (
                    <Button
                      variant="destructive-secondary"
                      disabled={disabled !== undefined}
                      onClick={openDialog}
                    >
                      {t("transferProject")}
                    </Button>
                  )}
                </TransferProjectDialogController>
              ),
            },
            {
              title: t("deleteProjectTitle"),
              description: t("deleteProjectDescription"),
              button: (
                <DeleteProjectDialogController>
                  {({ hasAccess, openDialog }) => (
                    <Button
                      variant="destructive-secondary"
                      disabled={!hasAccess}
                      onClick={openDialog}
                    >
                      {t("deleteProject")}
                    </Button>
                  )}
                </DeleteProjectDialogController>
              ),
            },
          ]}
        />
      </div>
    ),
  },
  {
    title: t("apiKeys"),
    slug: "api-keys",
    cmdKKeywords: ["auth", "public key", "secret key"],
    content: (
      <div className="flex flex-col gap-6">
        <ApiKeyList entityId={project.id} scope="project" />
      </div>
    ),
  },
  {
    title: t("developerTools"),
    slug: "developer-tools",
    cmdKKeywords: [
      "mcp",
      "cli",
      "skill",
      "agent",
      "model context protocol",
      "command line",
      "claude code",
      "cursor",
    ],
    content: <DeveloperToolsSettings projectId={project.id} />,
  },
  {
    title: t("llmConnections"),
    slug: "llm-connections",
    cmdKKeywords: [
      "llm",
      "provider",
      "openai",
      "anthropic",
      "azure",
      "playground",
      "evaluation",
      "endpoint",
      "api",
    ],
    content: (
      <div className="flex flex-col gap-6">
        <LlmApiKeyList projectId={project.id} />
      </div>
    ),
    show: showLLMConnectionsSettings,
  },
  {
    title: t("modelDefinitions"),
    slug: "models",
    cmdKKeywords: ["cost", "token"],
    content: <ModelsSettings projectId={project.id} />,
  },
  {
    title: t("protectedLabels"),
    slug: "protected-prompt-labels",
    cmdKKeywords: ["prompt", "label", "protect", "lock"],
    content: <ProtectedLabelsSettings projectId={project.id} />,
    show: showProtectedLabelsSettings,
  },
  {
    title: t("scoreConfigs"),
    slug: "scores",
    cmdKKeywords: ["config"],
    content: <ScoreConfigSettings projectId={project.id} />,
    show: showScoreConfigSettings,
  },
  {
    title: t("members"),
    slug: "members",
    cmdKKeywords: ["invite", "user"],
    content: (
      <ProjectMembersSettings
        orgId={organization.id}
        project={{ id: project.id, name: project.name }}
      />
    ),
  },
  {
    title: t("integrations"),
    slug: "integrations",
    cmdKKeywords: ["posthog", "mixpanel", "analytics", "callback", "webhook"],
    content: <Integrations projectId={project.id} />,
  },
  {
    title: t("exports"),
    slug: "exports",
    cmdKKeywords: ["csv", "download", "json", "batch"],
    content: <BatchExportsSettingsPage projectId={project.id} />,
  },
  {
    title: t("batchActions"),
    slug: "batch-actions",
    cmdKKeywords: ["bulk", "batch", "action", "dataset", "delete"],
    content: <BatchActionsSettingsPage projectId={project.id} />,
  },
  {
    title: t("auditLogs"),
    slug: "audit-logs",
    cmdKKeywords: ["trail"],
    content: <AuditLogsSettingsPage projectId={project.id} />,
  },
  {
    title: t("notifications"),
    slug: "notifications",
    cmdKKeywords: ["inbox", "email", "mention", "alert", "slack", "webhook"],
    content: (
      <div className="flex flex-col gap-6">
        <PersonalNotificationSettings />
        {showProjectNotificationChannels && (
          <ProjectNotificationChannels projectId={project.id} />
        )}
      </div>
    ),
  },
  {
    title: t("billing"),
    slug: "billing",
    href: `/organization/${organization.id}/settings/billing`,
    show: showBillingSettings,
  },
  {
    title: t("organizationTitle"),
    slug: "organization",
    href: `/organization/${organization.id}/settings`,
  },
  {
    title: t("v4Migration"),
    slug: "v4-migration",
    href: "/v4-migration",
    show: showV4Migration,
  },
];

export default function ProjectSettingsPage() {
  const { t } = useTranslation("settings");
  const { project, organization } = useQueryProject();
  const router = useRouter();
  const pages = useProjectSettingsPages();

  if (!project || !organization) {
    return (
      <ContainerPage
        headerProps={{
          title: t("projectTitle"),
        }}
      >
        <NoDataOrLoading isLoading />
      </ContainerPage>
    );
  }

  return (
    <ContainerPage
      headerProps={{
        title: t("projectTitle"),
      }}
    >
      <PagedSettingsContainer
        activeSlug={router.query.page as string | undefined}
        pages={pages}
      />
    </ContainerPage>
  );
}

function ProjectMembersSettings({
  orgId,
  project,
}: {
  orgId: string;
  project: { id: string; name: string };
}) {
  const { t } = useTranslation("settings");
  const [invitesPagination, setInvitesPagination] = useSessionStorage(
    `projectInvites_${project.id}_pagination`,
    { pageIndex: 0, pageSize: 10 },
  );

  const hasOrgViewAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "organizationMembers:read",
  });

  const hasProjectViewAccess =
    useHasProjectAccess({
      projectId: project.id,
      scope: "projectMembers:read",
    }) || hasOrgViewAccess;

  const membershipInvites = api.members.allInvitesFromProject.useQuery(
    {
      projectId: project.id,
      page: invitesPagination.pageIndex,
      limit: invitesPagination.pageSize,
    },
    { enabled: hasProjectViewAccess },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Header title={t("projectMembers")} />
        <ConnectedMembersSettingsTable orgId={orgId} project={project} />
      </div>
      {hasProjectViewAccess && (
        <div
          className={
            membershipInvites.data?.totalCount === 0 ? "hidden" : undefined
          }
        >
          <Header title={t("membershipInvites")} />
          <ConnectedMembershipInvitesSettingsTable
            orgId={orgId}
            projectId={project.id}
            query={membershipInvites}
            paginationState={invitesPagination}
            setPaginationState={setInvitesPagination}
          />
        </div>
      )}
    </div>
  );
}

const Integrations = (props: { projectId: string }) => {
  const { t } = useTranslation("settings");
  const hasAccess = useHasProjectAccess({
    projectId: props.projectId,
    scope: "integrations:CRUD",
  });

  const allowBlobStorageIntegration = useHasEntitlement(
    "scheduled-blob-exports",
  );

  return (
    <div>
      <Header title={t("integrations")} />
      <div className="space-y-6">
        <Card className="p-3">
          {}
          <PostHogLogo className="text-foreground mb-4 w-40" />
          <p className="text-primary mb-4 text-sm">{t("posthogDescription")}</p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              href={`/project/${props.projectId}/settings/integrations/posthog`}
            >
              {t("configure")}
            </ActionButton>
            <Button asChild variant="ghost">
              <Link
                href="https://langfuse.com/integrations/analytics/posthog"
                target="_blank"
              >
                {t("integrationDocs")}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <MixpanelLogo className="text-foreground mb-4 w-20" />
          <p className="text-primary mb-4 text-sm">
            {t("mixpanelDescription")}
          </p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              href={`/project/${props.projectId}/settings/integrations/mixpanel`}
            >
              {t("configure")}
            </ActionButton>
            <Button asChild variant="ghost">
              <Link
                href="https://langfuse.com/integrations/analytics/mixpanel"
                target="_blank"
              >
                {t("integrationDocs")}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <span className="font-bold">{t("blobStorage")}</span>
          <p className="text-primary mb-4 text-sm">{t("blobDescription")}</p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              hasEntitlement={allowBlobStorageIntegration}
              href={`/project/${props.projectId}/settings/integrations/blobstorage`}
            >
              {t("configure")}
            </ActionButton>
            <Button asChild variant="ghost">
              <Link
                href="https://langfuse.com/docs/query-traces#blob-storage"
                target="_blank"
              >
                {t("integrationDocs")}
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-3">
          <div className="mb-4 flex items-center gap-2">
            <SiSlack className="text-foreground h-5 w-5" />
            <span className="font-bold">Slack</span>
          </div>
          <p className="text-primary mb-4 text-sm">{t("slackDescription")}</p>
          <div className="flex items-center gap-2">
            <ActionButton
              variant="secondary"
              hasAccess={hasAccess}
              href={`/project/${props.projectId}/settings/integrations/slack`}
            >
              {t("configure")}
            </ActionButton>
          </div>
        </Card>

        <WebCalloutIntegrationCard
          projectId={props.projectId}
          hasAccess={hasAccess}
        />
      </div>
    </div>
  );
};
