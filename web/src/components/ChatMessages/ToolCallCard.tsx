/* eslint-disable @repo/no-margin-on-root-elements */
import { useTranslation } from "react-i18next";
import { type LLMToolCall } from "@langfuse/shared";
import { PrettyJsonView } from "@/src/components/ui/PrettyJsonView";

export const ToolCallCard: React.FC<{ toolCall: LLMToolCall }> = ({
  toolCall,
}) => {
  const { t } = useTranslation("settingsMore");
  return (
    <div className="my-1 rounded border border-gray-200 p-2 text-sm dark:border-gray-700">
      <div className="flex flex-row gap-4">
        <div className="flex w-[15%] flex-col overflow-hidden">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("chat.toolCalled")}
          </div>
          <div className="mt-1 overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap">
            {toolCall.name}
          </div>
        </div>
        <div className="w-[50%] flex-1 overflow-hidden">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("chat.arguments")}
          </div>
          <PrettyJsonView
            json={toolCall.args}
            codeClassName="border-none p-1"
            currentView="pretty"
          />
        </div>
        <div className="flex w-[25%] flex-col overflow-hidden">
          <div className="text-xs text-gray-500 dark:text-gray-400">ID</div>
          <div className="mt-1 overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {toolCall.id}
          </div>
        </div>
      </div>
    </div>
  );
};
