import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

import { Alert } from "@/src/components/design-system/Alert/Alert";
import { useTranslation } from "react-i18next";

export function EvaluationRuleAttachmentValidationAlert({
  message,
  onDismiss,
  reviewHref,
  onReview,
}: {
  /** Why the attached rule needs a mapping review. */
  message: string;
  onDismiss: () => void;
  reviewHref: string;
  onReview?: () => void;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Alert variant="warning" actionPosition="top-right" icon={AlertTriangle}>
      <button
        type="button"
        className="absolute top-2.5 right-2.5 grid size-7 cursor-pointer place-items-center rounded-sm border-none bg-transparent"
        aria-label={tFeatures("ui.dismissValidationWarning")}
        onClick={onDismiss}
      >
        <X className="size-4 stroke-current" aria-hidden="true" />
      </button>
      <Alert.Title>
        {tFeatures("ui.reviewEvaluatorVariableMapping")}
      </Alert.Title>
      <Alert.Description>
        <div className="flex flex-col items-start gap-1">
          <p>{message}</p>
          <Link
            href={reviewHref}
            className="font-bold underline underline-offset-2"
            onClick={onReview}
          >
            {tFeatures("ui.reviewHowTheEvaluatorMapsDataToVariables")}
          </Link>
        </div>
      </Alert.Description>
    </Alert>
  );
}
