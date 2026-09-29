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
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
import {
  BlobStorageExportMode,
  BlobStorageIntegrationFileType,
} from "@langfuse/shared";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";

// Frequency, file type, and export mode (with the custom start date when the
// mode requires one).
export const ExportScheduleFields = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const { t } = useTranslation("settingsMore");
  const watchedExportMode = useWatch({ control, name: "exportMode" });

  return (
    <>
      <FormField
        control={control}
        name="exportFrequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("blob.frequency")}</FormLabel>
            <FormControl>
              <SelectInput
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t("blob.selectFrequency")}
                options={[
                  {
                    value: "every_20_minutes",
                    label: t("blob.every20Minutes"),
                  },
                  { value: "hourly", label: t("blob.hourly") },
                  { value: "daily", label: t("blob.daily") },
                  { value: "weekly", label: t("blob.weekly") },
                ]}
              />
            </FormControl>
            <FormDescription>{t("blob.frequencyHint")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="fileType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("blob.fileType")}</FormLabel>
            <FormControl>
              <SelectInput
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t("blob.selectFileType")}
                options={[
                  {
                    value: BlobStorageIntegrationFileType.PARQUET,
                    label: "Parquet",
                  },
                  {
                    value: BlobStorageIntegrationFileType.JSONL,
                    label: "JSONL",
                  },
                  {
                    value: BlobStorageIntegrationFileType.CSV,
                    label: "CSV",
                  },
                  {
                    value: BlobStorageIntegrationFileType.JSON,
                    label: "JSON",
                  },
                ]}
              />
            </FormControl>
            <FormDescription>
              {field.value === BlobStorageIntegrationFileType.PARQUET
                ? t("blob.parquetHint")
                : t("blob.fileTypeHint")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="exportMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("blob.mode")}</FormLabel>
            <FormControl>
              <SelectInput
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t("blob.selectMode")}
                options={[
                  {
                    value: BlobStorageExportMode.FULL_HISTORY,
                    label: t("blob.fullHistory"),
                  },
                  {
                    value: BlobStorageExportMode.FROM_TODAY,
                    label: t("blob.today"),
                  },
                  {
                    value: BlobStorageExportMode.FROM_CUSTOM_DATE,
                    label: t("blob.customDate"),
                  },
                ]}
              />
            </FormControl>
            <FormDescription>{t("blob.modeHint")}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchedExportMode === BlobStorageExportMode.FROM_CUSTOM_DATE && (
        <FormField
          control={control}
          name="exportStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("blob.startDate")}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={(() => {
                    const t = new Date();
                    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                  })()}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const date = e.target.value
                      ? new Date(e.target.value)
                      : null;
                    field.onChange(date);
                  }}
                  placeholder={t("blob.selectStartDate")}
                />
              </FormControl>
              <FormDescription>{t("blob.startDateHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
