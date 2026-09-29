import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/src/components/design-system/Badge/Badge";
import { useTranslation } from "react-i18next";

export function EvaluatorBadge({
  evaluatorId,
  evaluatorName,
  projectId,
}: {
  evaluatorId: string;
  evaluatorName?: string | null;
  projectId: string;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <Link
      href={`/project/${projectId}/evals/v2/${encodeURIComponent(evaluatorId)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="ph-no-capture inline-flex"
    >
      <Badge
        text={
          evaluatorName
            ? `Evaluator: ${evaluatorName}`
            : tFeatures("ui.evaluator")
        }
        trailingIcon={ExternalLinkIcon}
      />
    </Link>
  );
}
