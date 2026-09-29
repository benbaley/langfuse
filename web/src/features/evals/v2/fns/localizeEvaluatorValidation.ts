import type { TFunction } from "i18next";
import { getMinimumCategoricalCategoriesMessage } from "@langfuse/shared";

const MESSAGE_KEYS: Record<string, string> = {
  "Category names cannot be empty.": "evalsMore:validation.categoryEmpty",
  "Category names must be unique.": "evalsMore:validation.categoryUnique",
  "Add content to every prompt message before saving.":
    "evalsMore:validation.promptContent",
  "System messages are only allowed as the first prompt message.":
    "evalsMore:validation.systemFirst",
  "Every question needs instructions.": "evalsMore:validation.instructions",
  "Every question needs a score name.": "evalsMore:validation.scoreName",
  "Every option needs a label.": "evalsMore:validation.optionLabel",
  "Option labels must be unique.": "evalsMore:validation.optionUnique",
  "Every level needs a description.": "evalsMore:validation.levelDescription",
  [`${getMinimumCategoricalCategoriesMessage()}.`]:
    "evalsMore:validation.minCategories",
};

/** Translate local evaluator validation only; unknown details remain intact. */
export function localizeEvaluatorValidation(
  t: TFunction,
  message: string,
): string {
  const key = MESSAGE_KEYS[message];
  if (key) return t(key);
  const duplicate = /^Another question already writes “([\s\S]*)”\.$/.exec(
    message,
  );
  if (duplicate)
    return t("evalsMore:validation.duplicateScore", { name: duplicate[1] });
  const minimum = /^Add at least (\d+) (options|levels)\.$/.exec(message);
  if (minimum)
    return t(
      minimum[2] === "options"
        ? "evalsMore:validation.minimumOptions"
        : "evalsMore:validation.minimumLevels",
      { minimum: minimum[1] },
    );
  return message;
}
