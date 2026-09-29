import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { SelectInput } from "@/src/components/design-system/SelectInput/SelectInput";
import { Label } from "@/src/components/ui/label";
import { api } from "@/src/utils/api";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { copyTextToClipboard } from "@/src/utils/clipboard";
import { getPromptDetailHref } from "@/src/features/prompts/utils";
import { useTranslation } from "react-i18next";

type PromptSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (tag: string) => void;
  projectId: string;
};

export function PromptSelectionDialog({
  isOpen,
  onClose,
  onSelect,
  projectId,
}: PromptSelectionDialogProps) {
  const { t: tMore } = useTranslation("coreMore");
  const { t: tFeatures } = useTranslation("features");
  const [selectedPromptName, setSelectedPromptName] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectionType, setSelectionType] = useState<"version" | "label">(
    "label",
  );
  const [selectedVersionOrLabel, setSelectedVersionOrLabel] =
    useState<string>("");

  const copySelectedTag = useCallback(() => {
    copyTextToClipboard(selectedTag);
  }, [selectedTag]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPromptName("");
      setSelectedTag("");
      setSelectionType("label");
      setSelectedVersionOrLabel("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedPromptName && selectedVersionOrLabel) {
      if (selectionType === "version") {
        setSelectedTag(
          `@@@langfusePrompt:name=${selectedPromptName}|version=${selectedVersionOrLabel}@@@`,
        );
      } else {
        setSelectedTag(
          `@@@langfusePrompt:name=${selectedPromptName}|label=${selectedVersionOrLabel}@@@`,
        );
      }
    } else {
      setSelectedTag("");
    }
  }, [selectedPromptName, selectedVersionOrLabel, selectionType]);

  const { data: promptOptions } = api.prompts.getPromptLinkOptions.useQuery(
    {
      projectId,
    },
    {
      enabled: Boolean(projectId),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    },
  );

  const selectedPrompt = promptOptions?.find(
    (option) => option.name === selectedPromptName,
  );

  const handleConfirm = useCallback(() => {
    if (!selectedTag) return;
    if (onSelect) {
      onSelect(selectedTag);
    } else {
      copySelectedTag();
    }
    onClose();
  }, [copySelectedTag, selectedTag, onSelect, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tFeatures("ui.addInlinePromptReference")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {tMore("prompts.referenceHelp")}
            </p>

            <div className="flex flex-col gap-2">
              <Label htmlFor="prompt-name">{tFeatures("ui.promptName")}</Label>
              <SelectInput
                id="prompt-name"
                value={selectedPromptName}
                onValueChange={(value) => {
                  setSelectedPromptName(value);
                  setSelectedVersionOrLabel("");
                }}
                placeholder={tFeatures("ui.selectATextPrompt")}
                options={
                  promptOptions?.map((prompt) => ({
                    value: prompt.name,
                    label: prompt.name,
                  })) ?? []
                }
              />
              <p className="text-muted-foreground text-xs">
                {tFeatures("ui.onlyTextPromptsCanBeReferencedInline")}
              </p>
            </div>

            {selectedPromptName && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="selection-type">
                  {tFeatures("ui.referenceBy")}
                </Label>
                <SelectInput
                  id="selection-type"
                  value={selectionType}
                  onValueChange={(value: "version" | "label") => {
                    setSelectionType(value);
                    setSelectedVersionOrLabel("");
                  }}
                  placeholder={tFeatures("ui.selectLinkType")}
                  options={[
                    { value: "label", label: tFeatures("ui.label") },
                    { value: "version", label: tFeatures("ui.version") },
                  ]}
                />
              </div>
            )}

            {selectedPromptName && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="version-or-label">
                  {selectionType === "version"
                    ? tFeatures("ui.version")
                    : tFeatures("ui.label")}
                </Label>
                <div className="flex gap-2">
                  <SelectInput
                    id="version-or-label"
                    value={selectedVersionOrLabel}
                    onValueChange={setSelectedVersionOrLabel}
                    placeholder={
                      selectionType === "version"
                        ? tFeatures("ui.selectAVersion")
                        : tFeatures("ui.selectALabel")
                    }
                    options={
                      selectionType === "version"
                        ? (selectedPrompt?.versions.map((version) => ({
                            value: version.toString(),
                            label: version.toString(),
                          })) ?? [])
                        : (selectedPrompt?.labels.map((label) => ({
                            value: label,
                            label,
                          })) ?? [])
                    }
                  />
                  {selectedVersionOrLabel && (
                    <Link
                      href={`${getPromptDetailHref(projectId, selectedPromptName)}?${selectionType}=${encodeURIComponent(selectedVersionOrLabel)}`}
                      target="_blank"
                      passHref
                    >
                      <Button type="button" variant="outline" size="icon">
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedTag && (
            <div className="space-y-2">
              <Label>{tFeatures("ui.tagPreview")}</Label>
              <div className="relative">
                <div className="bg-muted rounded-md border p-3 pr-10 font-mono text-xs">
                  {selectedTag}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={copySelectedTag}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {onSelect
                  ? tFeatures("ui.thisTagWillBeInsertedIntoThePromptContent")
                  : tFeatures(
                      "ui.thisTagWillBeCopiedToClipboardToBeThenInsertedIntoThePrompt",
                    )}
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {tFeatures("ui.cancel")}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selectedTag}>
            {onSelect ? tFeatures("ui.insert") : tFeatures("ui.copyAndClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
