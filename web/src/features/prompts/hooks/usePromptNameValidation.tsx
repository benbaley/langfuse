import { useEffect } from "react";
import { type UseFormReturn } from "react-hook-form";

interface UsePromptNameValidationProps {
  currentName: string | undefined;
  allPrompts: { value: string }[] | undefined;
  form: UseFormReturn<any>;
}

export const usePromptNameValidation = ({
  currentName,
  allPrompts,
  form,
}: UsePromptNameValidationProps) => {
  useEffect(() => {
    if (!currentName || !allPrompts) return;

    const isNewPrompt = !allPrompts
      ?.map((prompt) => prompt.value)
      .includes(currentName);

    if (!isNewPrompt) {
      form.setError("name", { message: "prompts.validation.nameExists" });
    } else {
      const currentError = form.getFieldState("name").error;
      if (currentError?.message === "prompts.validation.nameExists") {
        form.clearErrors("name");
      }
    }
  }, [currentName, allPrompts, form]);
};
