import type { TFunction } from "i18next";
import type { FieldValues, Resolver } from "react-hook-form";

const validationKeys: Record<string, string> = {
  "Invalid email address": "validation.email",
  "Password must be at least 8 characters long": "validation.passwordLength",
  "Password must be at least 8 characters long.": "validation.passwordLength",
  "Please choose a secure password by combining letters, numbers, and special characters.":
    "validation.passwordStrength",
  "Verification code must be 6 digits.": "validation.code",
  "Passwords do not match": "validation.passwordMatch",
  "Text cannot be empty": "validation.nameRequired",
  "Text cannot contain HTML tags": "validation.noHtml",
  "Name must be at most 100 characters": "validation.nameLength",
  "Input should not contain a URL": "validation.noUrl",
  "Name can only contain letters, numbers, and spaces": "validation.simpleName",
  "Name must start with a letter and can only contain letters, numbers, spaces, hyphens, apostrophes, and periods":
    "validation.nameCharacters",
};

export function localizeAuthMessage(
  t: TFunction<"auth">,
  message: unknown,
): string | undefined {
  if (typeof message !== "string") return undefined;
  const key =
    message.startsWith("validation.") || message.startsWith("errors.")
      ? message
      : validationKeys[message];
  return key ? t(key) : message;
}

// Authentication forms have flat fields. Store known message keys after parsing
// so visible errors follow the locale without revalidating or changing values.
export function localizeAuthResolver<
  Input extends FieldValues,
  Context,
  Output,
>(
  resolver: Resolver<Input, Context, Output>,
): Resolver<Input, Context, Output> {
  return async (values, context, options) => {
    const result = await resolver(values, context, options);
    for (const field in result.errors) {
      const error = result.errors[field];
      if (typeof error?.message !== "string") continue;
      const key = validationKeys[error.message];
      if (key) error.message = key;
    }
    return result;
  };
}
