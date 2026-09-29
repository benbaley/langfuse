import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { type ExperimentDetailsStepProps } from "@/src/features/experiments/types/stepProps";
import { StepHeader } from "@/src/features/experiments/components/shared/StepHeader";
import { useTranslation } from "react-i18next";

export const ExperimentDetailsStep: React.FC<ExperimentDetailsStepProps> = ({
  formState,
}) => {
  const { t: tFeatures } = useTranslation("features");
  const { form } = formState;
  return (
    <div className="space-y-6">
      <StepHeader
        title={tFeatures("ui.experimentRunDetailsTitle")}
        description={tFeatures(
          "ui.provideANameAndOptionalDescriptionForYourExperimentToHelpIdentifyAndTrackIt",
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tFeatures("ui.experimentName")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={tFeatures("ui.enterExperimentName")}
                className="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tFeatures("ui.descriptionOptional")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={tFeatures(
                  "ui.describeThePurposeOrContextOfThisExperiment",
                )}
                className="min-h-[100px] w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
