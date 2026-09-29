import { type TFunction } from "i18next";

/** Translate local validation codes without interpreting remote error text. */
export function translateDatasetFormError(
  message: unknown,
  t: TFunction<"coreMore">,
) {
  switch (message) {
    case "datasets.validation.json":
    case "datasets.validation.schema":
    case "datasets.validation.select":
      return t(message);
    default:
      return undefined;
  }
}
