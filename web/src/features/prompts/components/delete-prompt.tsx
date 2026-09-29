/* eslint-disable @repo/no-abstracted-overlay-trigger */
import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac";
import { api } from "@/src/utils/api";
import { Trash } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { useTranslation } from "react-i18next";

export function DeletePrompt({ promptName }: { promptName: string }) {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });

  const mutDeletePrompt = api.prompts.delete.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!hasAccess}>
          <Trash className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <h2 className="mb-3 font-bold">{tFeatures("ui.pleaseConfirm")}</h2>
        <p className="mb-3 text-sm">
          {tMore("prompts.deleteWarning", { name: promptName })}
        </p>
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-bold">{tFeatures("ui.error")}</p>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="destructive"
            loading={mutDeletePrompt.isPending}
            onClick={() => {
              if (!projectId) {
                console.error("Project ID is missing");
                return;
              }
              setError(null);

              mutDeletePrompt.mutate({
                projectId,
                promptName,
              });
            }}
          >
            {tFeatures("ui.deletePrompt")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
