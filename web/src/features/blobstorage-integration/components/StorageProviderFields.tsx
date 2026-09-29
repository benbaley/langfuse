/* eslint-disable no-nested-ternary */
import { useTranslation } from "react-i18next";
import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { PasswordInput } from "@/src/components/design-system/PasswordInput/PasswordInput";
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import { BlobStorageIntegrationType } from "@langfuse/shared";
import { useLangfuseCloudRegion } from "@/src/features/organizations";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";

// Provider selection plus the connection fields whose labels and visibility
// depend on it: bucket/container, endpoint, region, path style, credentials,
// and prefix.
export const StorageProviderFields = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const { t } = useTranslation("settingsMore");
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  // Check if this is a self-hosted instance (no cloud region set)
  const isSelfHosted = !isLangfuseCloud;
  const integrationType =
    useWatch({ control, name: "type" }) ?? BlobStorageIntegrationType.S3;

  return (
    <>
      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("blob.provider")}</FormLabel>
            <FormControl>
              <SelectInput
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t("blob.selectProvider")}
                options={[
                  { value: BlobStorageIntegrationType.S3, label: "AWS S3" },
                  {
                    value: BlobStorageIntegrationType.S3_COMPATIBLE,
                    label: t("blob.s3Compatible"),
                  },
                  {
                    value: BlobStorageIntegrationType.AZURE_BLOB_STORAGE,
                    label: "Azure Blob Storage",
                  },
                ]}
              />
            </FormControl>
            <FormDescription>{t("blob.providerHint")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="bucketName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.containerName")
                : t("blob.bucketName")}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.containerHint")
                : t("blob.bucketHint")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Endpoint URL field - Only shown for S3-compatible and Azure */}
      {integrationType !== "S3" && (
        <FormField
          control={control}
          name="endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("blob.endpoint")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? t("blob.azureEndpointHint")
                  : t("blob.s3EndpointHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Region field - Only shown for AWS S3 or compatible storage */}
      {integrationType !== "AZURE_BLOB_STORAGE" && (
        <FormField
          control={control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("blob.region")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {integrationType === "S3"
                  ? t("blob.awsRegionHint")
                  : t("blob.s3RegionHint")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Force Path Style switch - Only shown for S3-compatible */}
      {integrationType === "S3_COMPATIBLE" && (
        <FormField
          control={control}
          name="forcePathStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("blob.forcePathStyle")}</FormLabel>
              <FormControl>
                <div className="mt-1 ml-4">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormDescription>{t("blob.forcePathHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="accessKeyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.accountName")
                : integrationType === "S3"
                  ? t("llm.awsAccessKeyId")
                  : t("blob.accessKeyId")}
              {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
              {isSelfHosted && integrationType === "S3" && (
                <span className="text-muted-foreground">
                  {" "}
                  {t("common.optional")}
                </span>
              )}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.accountNameHint")
                : integrationType === "S3"
                  ? isSelfHosted
                    ? t("blob.awsKeyOptional")
                    : t("blob.awsKeyHint")
                  : t("blob.s3KeyHint")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="secretAccessKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.accountKey")
                : integrationType === "S3"
                  ? t("llm.awsSecretKey")
                  : t("blob.secretKey")}
              {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
              {isSelfHosted && integrationType === "S3" && (
                <span className="text-muted-foreground">
                  {" "}
                  {t("common.optional")}
                </span>
              )}
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="********************"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.azureKeyHint")
                : integrationType === "S3"
                  ? isSelfHosted
                    ? t("blob.awsSecretOptional")
                    : t("blob.awsSecretHint")
                  : t("blob.s3SecretHint")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("blob.prefix")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? t("blob.azurePrefixHint")
                : integrationType === "S3"
                  ? t("blob.s3PrefixHint")
                  : t("blob.prefixHint")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
