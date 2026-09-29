// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { createRef, useState } from "react";
import { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { closeSearchPanel, openSearchPanel } from "@codemirror/search";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { CodeMirrorEditor } from "@/src/components/editor/CodeMirrorEditor";
import en from "@/src/features/i18n/locales/en/common.json";
import zhCN from "@/src/features/i18n/locales/zh-CN/common.json";

it("changes native editor phrases without resetting content, selection, or undo history", async () => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    fallbackLng: "en",
    resources: { en: { common: en }, "zh-CN": { common: zhCN } },
  });
  const editorRef = createRef<ReactCodeMirrorRef>();
  function EditorHarness() {
    const [value, setValue] = useState("customer payload");
    return (
      <CodeMirrorEditor
        value={value}
        onChange={setValue}
        mode="text"
        editorRef={editorRef}
      />
    );
  }
  render(
    <I18nextProvider i18n={i18n}>
      <EditorHarness />
    </I18nextProvider>,
  );
  await waitFor(() => expect(editorRef.current?.view).toBeDefined());
  const view = editorRef.current!.view!;
  act(() => {
    view.dispatch({
      changes: { from: view.state.doc.length, insert: " draft" },
      selection: { anchor: 4 },
    });
  });
  await act(() => i18n.changeLanguage("zh-CN"));
  expect(editorRef.current?.view).toBe(view);
  expect(view.state.doc.toString()).toBe("customer payload draft");
  expect(view.state.selection.main.anchor).toBe(4);
  act(() => {
    openSearchPanel(view);
  });
  expect(screen.getByPlaceholderText("查找")).toBeInTheDocument();
  act(() => {
    closeSearchPanel(view);
    view.contentDOM.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        code: "KeyZ",
        ctrlKey: true,
        bubbles: true,
      }),
    );
  });
  expect(view.state.doc.toString()).toBe("customer payload");
  await act(() => i18n.changeLanguage("en"));
  act(() => {
    openSearchPanel(view);
  });
  expect(screen.getByPlaceholderText("Find")).toBeInTheDocument();
});
