import { type SessionTimelineConversationMessage } from "@/src/features/sessions/SessionConversationTimeline/fns/processTimelineMessages";
import { SessionTimelineCollapsiblePart } from "@/src/features/sessions/SessionConversationTimeline/components/SessionTimelineCollapsiblePart/SessionTimelineCollapsiblePart";
import { SessionTimelinePart } from "@/src/features/sessions/SessionConversationTimeline/components/SessionTimelinePart/SessionTimelinePart";
import { useTranslation } from "react-i18next";

export function SessionTimelineSystemMessage({
  parts,
  senderName,
}: {
  parts: SessionTimelineConversationMessage["parts"];
  senderName: SessionTimelineConversationMessage["senderName"];
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <div className="ph-no-capture flex w-full">
      <SessionTimelineCollapsiblePart
        label={senderName ?? tFeatures("ui.systemPrompt")}
        variant="plain"
        alignment="row"
      >
        <div className="text-muted-foreground flex flex-col gap-2 text-sm leading-6">
          {parts.map((part, index) => (
            <SessionTimelinePart key={`${part.type}-${index}`} part={part} />
          ))}
        </div>
      </SessionTimelineCollapsiblePart>
    </div>
  );
}
