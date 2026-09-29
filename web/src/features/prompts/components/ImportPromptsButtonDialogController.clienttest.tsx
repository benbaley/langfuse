import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { type ReactNode } from "react";
import { createUiI18n } from "@/src/features/i18n/instance";
import en from "@/src/features/i18n/locales/en/coreMore.json";
import zh from "@/src/features/i18n/locales/zh-CN/coreMore.json";

vi.mock("@/src/features/rbac", () => ({ useHasProjectAccess: () => true }));
vi.mock("@/src/features/posthog-analytics", () => ({
  usePostHogClientCapture: () => vi.fn(),
}));
vi.mock("@/src/utils/api", () => ({
  api: {
    useUtils: () => ({ prompts: { invalidate: vi.fn() } }),
    prompts: {
      importBulk: {
        useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
      },
    },
  },
}));
vi.mock("@/src/components/design-system/Dropzone/Dropzone", () => ({
  Dropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => (
    <input
      type="file"
      aria-label="Import file"
      onChange={(event) => onDrop(Array.from(event.target.files ?? []))}
    />
  ),
}));
vi.mock("@/src/components/ui/dialog", () => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
      open ? (
        children
      ) : (
        <>{children instanceof Array ? children[0] : children}</>
      ),
    DialogBody: Wrapper,
    DialogContent: Wrapper,
    DialogFooter: Wrapper,
    DialogHeader: Wrapper,
    DialogTitle: Wrapper,
  };
});

import { ImportPromptsButtonDialogController } from "./ImportPromptsButtonDialogController";

afterEach(cleanup);

describe("prompt import language", () => {
  it("updates an existing validation error after a language change without reading the file again", async () => {
    const i18n = createUiI18n("en");
    i18n.addResourceBundle("en", "coreMore", en);
    i18n.addResourceBundle("zh-CN", "coreMore", zh);
    const readSpy = vi.spyOn(FileReader.prototype, "readAsText");
    render(
      <I18nextProvider i18n={i18n}>
        <ImportPromptsButtonDialogController projectId="project">
          {({ openDialog }) => (
            <button onClick={openDialog}>Open import</button>
          )}
        </ImportPromptsButtonDialogController>
      </I18nextProvider>,
    );
    fireEvent.click(screen.getByText("Open import"));
    fireEvent.change(screen.getByLabelText("Import file"), {
      target: {
        files: [new File(["[]"], "prompts.json", { type: "application/json" })],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "File contains an empty array.",
      ),
    );
    await act(() => i18n.changeLanguage("zh-CN"));
    expect(screen.getByRole("alert").textContent).toBe("文件中的数组为空。");
    expect(readSpy).toHaveBeenCalledTimes(1);
    readSpy.mockRestore();
  });
});
