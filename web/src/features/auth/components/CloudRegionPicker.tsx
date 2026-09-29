/* eslint-disable @repo/no-abstracted-overlay-trigger */
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/src/components/ui/select";
import type { CloudRegion } from "@/src/features/organizations";
import { useTranslation } from "react-i18next";

export function CloudRegionPicker({
  regions,
  selectedRegion,
  onValueChange,
  isSignUpPage,
}: {
  regions: CloudRegion[];
  selectedRegion?: CloudRegion;
  onValueChange: (value: CloudRegion["name"]) => void;
  isSignUpPage?: boolean;
}) {
  const { t: tApp } = useTranslation("app");
  return (
    <div className="bg-card mt-8 -mb-10 rounded-lg px-6 py-6 text-sm sm:mx-auto sm:w-full sm:max-w-[480px] sm:rounded-lg sm:px-10">
      <div className="flex w-full flex-col gap-2">
        <div>
          <span className="text-sm leading-none font-bold">
            {tApp("ui.DataRegion")}
            <DataRegionInfo />
          </span>
          {isSignUpPage && selectedRegion?.name === "HIPAA" ? (
            <p className="text-muted-foreground text-xs">
              {tApp("ui.DemoProjectIsNotAvailableInTheHipaaDataRegion")}
            </p>
          ) : null}
        </div>
        <Select value={selectedRegion?.name} onValueChange={onValueChange}>
          <SelectTrigger
            className="w-full"
            disableValueLineClamp
            aria-label={
              selectedRegion ? `${selectedRegion.name} data region` : undefined
            }
          >
            {selectedRegion ? (
              <CloudRegionLabel region={selectedRegion} />
            ) : null}
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.name} value={region.name}>
                <CloudRegionLabel region={region} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRegion?.name === "HIPAA" && (
          <div className="bg-muted/50 text-muted-foreground mt-2 rounded-md p-3 text-xs">
            <p>
              {tApp(
                "ui.TheBusinessAssociateAgreementBaaIsOnlyEffectiveOnTheCloudProAndTeamsPlans",
              )}{" "}
              <a
                href="https://langfuse.com/security/hipaa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                {tApp("ui.LearnMoreAboutHipaaCompliance")}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudRegionLabel({ region }: { region: CloudRegion }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={
          region.name === "HIPAA"
            ? "translate-y-[-3px] text-xl leading-none"
            : "-translate-y-px text-xl leading-none"
        }
      >
        {region.flag}
      </span>
      <span>{region.name}</span>
    </span>
  );
}

const DataRegionInfo = () => {
  const { t: tApp } = useTranslation("app");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <a
          href="#"
          className="text-link hover:text-link-hover ml-1 text-xs"
          title={tApp("ui.WhatIsThis")}
          tabIndex={-1}
        >
          {tApp("ui.WhatIsThis")}
        </a>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tApp("ui.DataRegions")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="flex flex-col gap-2">
            <p>{tApp("ui.LangfuseCloudIsAvailableInFourDataRegions")}</p>
            <ul className="list-disc pl-5">
              <li>{tApp("ui.UsOregonAwsUsWest2")}</li>
              <li>{tApp("ui.EuIrelandAwsEuWest1")}</li>
              <li>{tApp("ui.JpTokyoAwsApNortheast1")}</li>
              <li>
                {tApp(
                  "ui.HipaaOregonAwsUsWest2HipaaCompliantRegionAvailableWithProAndTeamsPlans",
                )}
              </li>
            </ul>
            <p>
              {tApp(
                "ui.RegionsAreStrictlySeparatedAndNoDataIsSharedAcrossRegionsChoosingARegionCloseToYouCanHelpImproveSpeedAndComplyWithLocalDataResidencyLawsAndPrivacyRegulations",
              )}
            </p>
            <p>
              {tApp(
                "ui.YouCanHaveAccountsInMultipleRegionsEachRegionRequiresASeparateSubscription",
              )}
            </p>
            <p>
              {tApp("ui.LearnMoreAbout")}{" "}
              <a
                href="https://langfuse.com/security/data-regions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                {tApp("ui.DataRegions")}
              </a>{" "}
              {tApp("ui.And")}{" "}
              <a
                href="https://langfuse.com/docs/data-security-privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                {tApp("ui.DataSecurityPrivacy")}
              </a>
              .
            </p>
          </DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
