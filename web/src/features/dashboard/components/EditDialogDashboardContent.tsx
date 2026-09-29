import React, { useState } from "react";
import { api } from "@/src/utils/api";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { showErrorToast } from "@/src/features/notifications";
import { useTranslation } from "react-i18next";

interface EditDialogDashboardContentProps {
  closeDialog: () => void;
  projectId: string;
  dashboardId: string;
  initialName: string;
  initialDescription: string;
}

export function EditDialogDashboardContent({
  closeDialog,
  projectId,
  dashboardId,
  initialName,
  initialDescription,
}: EditDialogDashboardContentProps) {
  const { t: tApp } = useTranslation("app");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const utils = api.useUtils();

  const updateDashboard = api.dashboard.updateDashboardMetadata.useMutation({
    onSuccess: () => {
      utils.dashboard.invalidate();
      closeDialog();
    },
    onError: (e) => {
      showErrorToast("Failed to update dashboard", e.message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      showErrorToast("Validation error", "Dashboard name is required");
      return;
    }

    updateDashboard.mutate({
      projectId,
      dashboardId,
      name: name.trim(),
      description: description.trim(),
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{tApp("ui.EditDashboard")}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{tApp("ui.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tApp("ui.DashboardName")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{tApp("ui.description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tApp("ui.DashboardDescription")}
              rows={3}
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <div className="flex gap-2">
          <Button onClick={closeDialog} variant="outline" type="button">
            {tApp("ui.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            type="button"
            loading={updateDashboard.isPending}
          >
            {tApp("ui.SaveChanges")}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
