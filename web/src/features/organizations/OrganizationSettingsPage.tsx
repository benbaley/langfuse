import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { PagedSettingsContainer } from "@/src/components/PagedSettingsContainer";
import Header from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import { ConnectedMembershipInvitesSettingsTable } from "@/src/features/rbac/components/MembershipInvitesSettingsTable/ConnectedMembershipInvitesSettingsTable";
import { ConnectedMembersSettingsTable } from "@/src/features/rbac/components/MembersSettingsTable/ConnectedMembersSettingsTable";
import { useHasOrganizationAccess } from "@/src/features/rbac";
import { JSONView } from "@/src/components/ui/CodeJsonViewer";
import RenameOrganization from "@/src/features/organizations/components/RenameOrganization";
import { DeleteOrganizationDialogController } from "@/src/features/organizations/components/DeleteOrganizationDialogController";
import { useQueryOrganization } from "@/src/features/organizations/hooks";
import { useRouter } from "next/router";
import { SettingsDangerZone } from "@/src/components/SettingsDangerZone";
import { BillingSettings } from "@/src/ee/features/billing/components/BillingSettings";
import { useHasEntitlement, usePlan } from "@/src/features/entitlements";
import ContainerPage from "@/src/components/layouts/container-page";
import { NoDataOrLoading } from "@/src/components/NoDataOrLoading";
import { SSOSettings } from "@/src/ee/features/sso-settings";
import { isCloudPlan } from "@langfuse/shared";
import { useQueryProjectOrOrganization } from "@/src/features/projects";
import { ApiKeyList } from "@/src/features/public-api/components/ApiKeyList";
import AIFeatureSwitch from "@/src/features/organizations/components/AIFeatureSwitch";
import { useIsCloudBillingAvailable } from "@/src/ee/features/billing";
import { env } from "@/src/env.mjs";
import { OrgAuditLogsSettingsPage } from "@/src/ee/features/audit-log-viewer";
import { useV4UpgradeUiFlag } from "@/src/features/v4-migration/useV4UpgradeUiEnabled";
import { OrganizationFeaturePreviewsSettings } from "@/src/features/feature-flags/components/OrganizationFeaturePreviewsSettings";
import { useIsFeatureEnabled } from "@/src/features/feature-flags";
import {
  GatewayApiKeysPage,
  GatewayConfigurationPage,
  GatewayModelsPage,
  GatewayProvidersPage,
} from "@/src/features/ai-gateway";
import useSessionStorage from "@/src/components/useSessionStorage";
import { api } from "@/src/utils/api";

type OrganizationSettingsPage = {
  title: string;
  slug: string;
  section?: string;
  show?: boolean | (() => boolean);
  cmdKKeywords?: string[];
} & ({ content: React.ReactNode } | { href: string });

export function useOrganizationSettingsPages(): OrganizationSettingsPage[] {
  const { t } = useTranslation("settings");
  const { organization } = useQueryProjectOrOrganization();
  const showBillingSettings = useHasEntitlement("cloud-billing");
  const hasAdminApiEntitlement = useHasEntitlement("admin-api");
  const hasOrgApiKeyAccess = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:CRUD_apiKeys",
  });
  const showOrgApiKeySettings = hasAdminApiEntitlement && hasOrgApiKeyAccess;
  const showAuditLogs = useHasEntitlement("audit-logs");
  const canUpdateOrganization = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "organization:update",
  });
  const canManageGateway = useHasOrganizationAccess({
    organizationId: organization?.id,
    scope: "gateway:manage",
  });
  const plan = usePlan();
  const isLangfuseCloud = isCloudPlan(plan) ?? false;
  const isCloudBillingAvailable = useIsCloudBillingAvailable();
  const showV4Migration = useV4UpgradeUiFlag();
  const isAiGatewayEnabled = useIsFeatureEnabled("aiGateway", {
    enableForAdmins: false,
    organizationId: organization?.id,
  });

  if (!organization) return [];

  return getOrganizationSettingsPages({
    t,
    organization,
    showBillingSettings: showBillingSettings && isCloudBillingAvailable,
    showOrgApiKeySettings,
    showAuditLogs,
    isLangfuseCloud,
    showV4Migration,
    showAiGateway: canManageGateway && isAiGatewayEnabled,
    showFeaturePreviews:
      canUpdateOrganization && organization.id !== env.NEXT_PUBLIC_DEMO_ORG_ID,
  });
}

export const getOrganizationSettingsPages = ({
  t,
  organization,
  showBillingSettings,
  showOrgApiKeySettings,
  showAuditLogs,
  isLangfuseCloud,
  showV4Migration,
  showAiGateway,
  showFeaturePreviews,
}: {
  t: TFunction<"settings">;
  organization: {
    id: string;
    name: string;
    metadata: Record<string, unknown>;
    projects: Array<{
      id: string;
      name: string;
      deletedAt?: Date | string | null;
    }>;
  };
  showBillingSettings: boolean;
  showOrgApiKeySettings: boolean;
  showAuditLogs: boolean;
  isLangfuseCloud: boolean;
  showV4Migration: boolean;
  showAiGateway: boolean;
  showFeaturePreviews: boolean;
}): OrganizationSettingsPage[] => [
  {
    title: t("general"),
    slug: "index",
    section: t("organization"),
    cmdKKeywords: ["name", "id", "delete"],
    content: (
      <div className="flex flex-col gap-6">
        <RenameOrganization />
        <div>
          <Header title={t("debugInformation")} />
          <JSONView
            title={t("metadata")}
            json={{
              name: organization.name,
              id: organization.id,
              ...organization.metadata,
              ...(env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION && {
                cloudRegion: env.NEXT_PUBLIC_LANGFUSE_CLOUD_REGION,
              }),
            }}
          />
        </div>
        <AIFeatureSwitch />
        <SettingsDangerZone
          items={[
            {
              title: t("deleteOrganizationTitle"),
              description: t("deleteOrganizationDescription"),
              button: (
                <DeleteOrganizationDialogController>
                  {({ disabled, openDialog }) => (
                    <Button
                      variant="destructive-secondary"
                      disabled={disabled !== undefined}
                      onClick={openDialog}
                    >
                      {t("deleteOrganization")}
                    </Button>
                  )}
                </DeleteOrganizationDialogController>
              ),
            },
          ]}
        />
      </div>
    ),
  },
  {
    title: t("featurePreviews"),
    slug: "feature-previews",
    section: t("organization"),
    cmdKKeywords: ["feature", "preview", "flags", "beta"],
    content: <OrganizationFeaturePreviewsSettings orgId={organization.id} />,
    show: showFeaturePreviews,
  },
  {
    title: t("apiKeys"),
    slug: "api-keys",
    section: t("organization"),
    content: (
      <div className="flex flex-col gap-6">
        <ApiKeyList entityId={organization.id} scope="organization" />
      </div>
    ),
    show: showOrgApiKeySettings,
  },
  {
    title: t("members"),
    slug: "members",
    section: t("organization"),
    cmdKKeywords: ["invite", "user", "rbac"],
    content: <OrganizationMembersSettings orgId={organization.id} />,
  },
  {
    title: t("auditLogs"),
    slug: "audit-logs",
    section: t("organization"),
    cmdKKeywords: ["audit", "logs", "history", "changes"],
    content: <OrgAuditLogsSettingsPage orgId={organization.id} />,
    show: showAuditLogs,
  },
  {
    title: t("billing"),
    slug: "billing",
    section: t("organization"),
    cmdKKeywords: ["payment", "subscription", "plan", "invoice"],
    content: <BillingSettings />,
    show: showBillingSettings,
  },
  {
    title: t("sso"),
    slug: "sso",
    section: t("organization"),
    cmdKKeywords: [
      "sso",
      "login",
      "auth",
      "okta",
      "saml",
      "azure",
      "domain",
      "dns",
      "txt",
      "verify",
    ],
    content: <SSOSettings orgId={organization.id} />,
    show: isLangfuseCloud,
  },
  {
    title: t("projects"),
    slug: "projects",
    section: t("organization"),
    href: `/organization/${organization.id}`,
  },
  {
    title: t("v4Migration"),
    slug: "v4-migration",
    section: t("organization"),
    href: "/v4-migration",
    show: showV4Migration,
  },
  {
    title: t("configuration"),
    slug: "ai-gateway",
    section: t("aiGateway"),
    cmdKKeywords: ["gateway", "llm", "configuration", "instrumentation"],
    content: (
      <GatewayConfigurationPage
        organizationId={organization.id}
        projects={organization.projects}
      />
    ),
    show: showAiGateway,
  },
  {
    title: t("providerCredentials"),
    slug: "ai-gateway-providers",
    section: t("aiGateway"),
    cmdKKeywords: [
      "gateway",
      "providers",
      "credentials",
      "openai",
      "anthropic",
    ],
    content: <GatewayProvidersPage organizationId={organization.id} />,
    show: showAiGateway,
  },
  {
    title: t("models"),
    slug: "ai-gateway-models",
    section: t("aiGateway"),
    cmdKKeywords: ["gateway", "models", "discovery", "sync"],
    content: <GatewayModelsPage organizationId={organization.id} />,
    show: showAiGateway,
  },
  {
    title: t("gatewayKeys"),
    slug: "ai-gateway-api-keys",
    section: t("aiGateway"),
    cmdKKeywords: ["gateway", "api", "keys", "metadata", "credentials"],
    content: <GatewayApiKeysPage organizationId={organization.id} />,
    show: showAiGateway,
  },
];

const OrganizationSettingsPage = () => {
  const { t } = useTranslation("settings");
  const organization = useQueryOrganization();
  const router = useRouter();
  const { page } = router.query;
  const pages = useOrganizationSettingsPages();

  if (!organization) {
    return (
      <ContainerPage
        headerProps={{
          title: t("organizationTitle"),
        }}
      >
        <NoDataOrLoading isLoading />
      </ContainerPage>
    );
  }

  return (
    <ContainerPage
      headerProps={{
        title: t("organizationTitle"),
      }}
      extendRight={router.query.page === "ai-gateway-models"}
      fullHeight={router.query.page === "ai-gateway-models"}
    >
      <PagedSettingsContainer
        activeSlug={page as string | undefined}
        pages={pages}
        fullHeight={router.query.page === "ai-gateway-models"}
      />
    </ContainerPage>
  );
};

export default OrganizationSettingsPage;

function OrganizationMembersSettings({ orgId }: { orgId: string }) {
  const { t } = useTranslation("settings");
  const [invitesPagination, setInvitesPagination] = useSessionStorage(
    `orgInvites_${orgId}_pagination`,
    { pageIndex: 0, pageSize: 10 },
  );

  const hasViewAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "organizationMembers:read",
  });

  const membershipInvites = api.members.allInvitesFromOrg.useQuery(
    {
      orgId,
      page: invitesPagination.pageIndex,
      limit: invitesPagination.pageSize,
    },
    { enabled: hasViewAccess },
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Header title={t("organizationMembers")} />
        <ConnectedMembersSettingsTable orgId={orgId} />
      </div>
      {hasViewAccess && (
        <div
          className={
            membershipInvites.data?.totalCount === 0 ? "hidden" : undefined
          }
        >
          <Header title={t("membershipInvites")} />
          <ConnectedMembershipInvitesSettingsTable
            orgId={orgId}
            query={membershipInvites}
            paginationState={invitesPagination}
            setPaginationState={setInvitesPagination}
          />
        </div>
      )}
    </div>
  );
}
