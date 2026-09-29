import type { ReactNode } from "react";

import { SectionHeader } from "@/src/features/evals/v2/components/Evaluators/Testing/components/SectionHeader/SectionHeader";
import { useTranslation } from "react-i18next";

export function TestSection({ content }: { content: ReactNode }) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <section className="flex shrink-0 flex-col gap-2">
      <SectionHeader
        title={tFeatures("ui.testTheEvaluator")}
        meta={null}
        description={null}
        tooltip={tFeatures("evalsMore:test.description")}
        trailing={null}
      />
      {content}
    </section>
  );
}
