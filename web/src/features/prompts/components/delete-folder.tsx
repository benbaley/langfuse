/* eslint-disable no-nested-ternary */
/* eslint-disable @repo/no-abstracted-overlay-trigger */
import { Button } from "@/src/components/ui/button";
import { useHasProjectAccess } from "@/src/features/rbac";
import { api } from "@/src/utils/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import useProjectIdFromURL from "@/src/hooks/useProjectIdFromURL";
import { Trash, Folder, FileText } from "lucide-react";
import { Spinner } from "@/src/components/design-system/Spinner/Spinner";
import { useTranslation } from "react-i18next";

export function DeleteFolder({ folderPath }: { folderPath: string }) {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const projectId = useProjectIdFromURL();
  const utils = api.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasAccess = useHasProjectAccess({ projectId, scope: "prompts:CUD" });

  const prompts = api.prompts.all.useQuery(
    {
      projectId: projectId as string,
      pathPrefix: folderPath,
      page: 0,
      limit: 100, // Fetch up to 100 prompts to show in the list
      filter: [],
      orderBy: { column: "createdAt", order: "DESC" },
    },
    {
      enabled: isOpen && !!projectId,
    },
  );

  const mutDeleteFolder = api.prompts.delete.useMutation({
    onSuccess: () => {
      utils.prompts.invalidate();
      setError(null);
      setIsOpen(false);
      setConfirmName("");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const folderName = folderPath.split("/").pop() ?? folderPath;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setConfirmName("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="xs" disabled={!hasAccess}>
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">
            {tMore("prompts.deleteFolderTitle", { name: folderName })}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-muted-foreground text-sm">
            {tMore("prompts.deleteFolderWarning", { path: folderPath })}
          </p>

          <div className="bg-muted/50 rounded-md border p-4">
            <h4 className="mb-2 text-sm font-bold">
              {tFeatures("ui.promptsToDelete")}
            </h4>
            {prompts.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" variant="muted" />
              </div>
            ) : prompts.isError ? (
              <div className="py-2 text-xs text-red-500">
                {tFeatures("ui.failedToLoadPrompts")} {prompts.error.message}
              </div>
            ) : (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                {prompts.data?.prompts.map((p) => (
                  <li
                    key={`${p.row_type}-${p.id}`}
                    className="text-muted-foreground flex items-center gap-2"
                  >
                    {p.row_type === "folder" ? (
                      <Folder className="h-3 w-3 text-blue-500" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    <span className="break-all">
                      {folderPath}/{p.name}
                    </span>
                  </li>
                ))}
                {(prompts.data?.totalCount ?? 0) > 100 && (
                  <li className="text-muted-foreground pt-1 italic">
                    {tMore("prompts.morePrompts", {
                      count: (prompts.data?.totalCount ?? 0) - 100,
                    })}
                  </li>
                )}
                {prompts.data?.prompts.length === 0 && (
                  <li className="text-muted-foreground italic">
                    {tFeatures("ui.noPromptsFoundInThisFolder")}
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">
              {tFeatures("ui.toConfirmTypeTheFullPathOfTheFolderToDelete")}
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={tMore("prompts.folderPath")}
              className="h-9"
            />
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-bold">{tFeatures("ui.error")}</p>
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            {tFeatures("ui.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirmName !== folderPath || mutDeleteFolder.isPending}
            loading={mutDeleteFolder.isPending}
            onClick={() => {
              if (!projectId) return;
              mutDeleteFolder.mutate({
                projectId,
                pathPrefix: folderPath,
              });
            }}
          >
            {tFeatures("ui.deleteFolder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
