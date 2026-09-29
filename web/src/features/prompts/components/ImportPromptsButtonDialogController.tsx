/* eslint-disable no-nested-ternary */
import { useHasProjectAccess } from "@/src/features/rbac";
import { type ReactNode, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Dropzone } from "@/src/components/design-system/Dropzone/Dropzone";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { api } from "@/src/utils/api";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics";
import { CreatePromptSchema } from "@langfuse/shared";
import { z } from "zod";
import { useTranslation } from "react-i18next";

type ImportItem = z.infer<typeof CreatePromptSchema>;

const IMPORT_MAX = 500;

const importPayloadSchema = z.array(CreatePromptSchema);

type LocalImportErrorKey =
  | "prompts.importArray"
  | "prompts.importEmpty"
  | "prompts.importTooMany"
  | "prompts.importInvalid"
  | "prompts.importRead"
  | "prompts.importParse"
  | "prompts.importFailed";

type ImportError = { key: LocalImportErrorKey } | { message: string };

class ImportValidationError extends Error {
  constructor(readonly key: LocalImportErrorKey) {
    super(key);
  }
}

function validateImportPayload(raw: unknown): ImportItem[] {
  if (!Array.isArray(raw)) {
    throw new ImportValidationError("prompts.importArray");
  }
  if (raw.length === 0) throw new ImportValidationError("prompts.importEmpty");
  if (raw.length > IMPORT_MAX)
    throw new ImportValidationError("prompts.importTooMany");
  const result = importPayloadSchema.safeParse(raw);
  if (!result.success) {
    throw new ImportValidationError("prompts.importInvalid");
  }
  return result.data;
}

type ImportResult = {
  name: string;
  success: boolean;
  error?: string;
};

type ImportState =
  | { step: "idle" }
  | {
      step: "parsed";
      file: File;
      items: ImportItem[];
      importError?: ImportError;
    }
  | { step: "error"; file?: File; error: ImportError }
  | { step: "done"; results: ImportResult[] };

const ImportPromptsDialogContent: React.FC<{
  isImportPending: boolean;
  onClose: () => void;
  onImport: (items: ImportItem[]) => Promise<{ results: ImportResult[] }>;
}> = ({ isImportPending, onClose, onImport }) => {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const { t: tCore } = useTranslation("core");
  const capture = usePostHogClientCapture();
  const [state, setState] = useState<ImportState>({ step: "idle" });

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setState({ step: "idle" });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string")
          throw new ImportValidationError("prompts.importRead");
        const raw = JSON.parse(text) as unknown;
        const items = validateImportPayload(raw);
        setState({ step: "parsed", file, items });
      } catch (err) {
        setState({
          step: "error",
          file,
          error: {
            key:
              err instanceof ImportValidationError
                ? err.key
                : "prompts.importParse",
          },
        });
      }
    };
    reader.onerror = () =>
      setState({ step: "error", file, error: { key: "prompts.importRead" } });
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (state.step !== "parsed") return;
    capture("prompts:bulk_import_submit", { count: state.items.length });
    const parsedState = state;
    setState({ ...parsedState, importError: undefined });

    try {
      const data = await onImport(parsedState.items);
      setState({ step: "done", results: data.results });
    } catch (error) {
      setState({
        ...parsedState,
        importError:
          error instanceof Error
            ? { message: error.message }
            : { key: "prompts.importFailed" },
      });
    }
  };

  if (state.step === "done") {
    const successCount = state.results.filter((r) => r.success).length;
    const failCount = state.results.filter((r) => !r.success).length;

    return (
      <>
        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">
              {tCore("prompts.importComplete", {
                succeeded: successCount,
                failed: failCount,
              })}
            </p>
            <div className="max-h-64 overflow-y-auto rounded-md border p-2 text-sm">
              {state.results.map((r, index) => (
                <div
                  key={`${r.name}-${index}`}
                  className="flex items-start gap-2 py-1"
                >
                  {r.success ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span className="font-mono">{r.name}</span>
                  {r.error && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      {r.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {tFeatures("ui.done")}
          </Button>
        </DialogFooter>
      </>
    );
  }

  const selectedFile =
    state.step === "parsed" || state.step === "error" ? state.file : undefined;
  const parsedItems = state.step === "parsed" ? state.items : null;
  const error =
    state.step === "error"
      ? state.error
      : state.step === "parsed"
        ? state.importError
        : undefined;

  return (
    <>
      <DialogBody className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {tCore("prompts.importDescription")}
        </p>
        <p className="text-muted-foreground text-sm">
          {tCore("prompts.importProductionLabel")}
        </p>
        <Dropzone
          accept={{ "application/json": [".json"] }}
          isDisabled={isImportPending}
          maxFiles={1}
          maxSize={undefined}
          minSize={undefined}
          onDrop={handleFiles}
          onError={(error) =>
            setState({ step: "error", error: { message: error.message } })
          }
          src={selectedFile ? [selectedFile] : undefined}
          variant="panel"
        />

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {"key" in error
              ? tMore(error.key, { max: IMPORT_MAX })
              : error.message}
          </p>
        )}

        {parsedItems && (
          <p className="text-muted-foreground text-sm">
            {tCore("prompts.importReady", { count: parsedItems.length })}
          </p>
        )}
      </DialogBody>

      <DialogFooter>
        <Button
          onClick={handleImport}
          disabled={!parsedItems || isImportPending}
          className="w-full"
        >
          {isImportPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tFeatures("ui.importing")}
            </>
          ) : (
            tFeatures("ui.import")
          )}
        </Button>
      </DialogFooter>
    </>
  );
};

export function ImportPromptsButtonDialogController({
  projectId,
  children,
}: {
  projectId: string;
  children: (control: {
    disabled: { reason: string } | undefined;
    openDialog: () => void;
  }) => ReactNode;
}) {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const [open, setOpen] = useState(false);
  const hasAccess = useHasProjectAccess({
    projectId,
    scope: "prompts:CUD",
  });
  const utils = api.useUtils();
  const importMutation = api.prompts.importBulk.useMutation({
    onSuccess: () => utils.prompts.invalidate(),
  });

  const disabled = hasAccess
    ? undefined
    : { reason: tMore("prompts.importPermission") };

  const openDialog = () => {
    if (!hasAccess) return;

    setOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && importMutation.isPending) return;

    setOpen(nextOpen);
  };

  return (
    <Dialog open={hasAccess && open} onOpenChange={handleOpenChange}>
      {children({ disabled, openDialog })}
      <DialogContent className="max-h-[90vh] min-h-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tFeatures("ui.importPrompts")}</DialogTitle>
        </DialogHeader>
        <ImportPromptsDialogContent
          isImportPending={importMutation.isPending}
          onClose={() => handleOpenChange(false)}
          onImport={(items) =>
            importMutation.mutateAsync({ projectId, prompts: items })
          }
        />
      </DialogContent>
    </Dialog>
  );
}
