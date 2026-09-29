import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createUiI18n } from "@/src/features/i18n/instance";
import { EvaluatorBackfillSettings } from "./EvaluatorBackfillSettings";

afterEach(cleanup);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("EvaluatorBackfillSettings language switching", () => {
  it("preserves and updates bounded form values when translated controls change order", async () => {
    const i18n = createUiI18n("en");
    const onMaxItemsChange = vi.fn();
    function Form() {
      const [maxItems, setMaxItems] = useState(100);
      return (
        <EvaluatorBackfillSettings
          enabled
          canEnable
          selectedWindow="7-days"
          range={{ from: new Date("2026-09-01"), to: new Date("2026-09-08") }}
          maxItems={maxItems}
          maxAllowedItems={1000}
          matchingObservations={2000}
          isEstimating={false}
          onEnabledChange={vi.fn()}
          onWindowChange={vi.fn()}
          onRangeChange={vi.fn()}
          onMaxItemsChange={(value) => {
            onMaxItemsChange(value);
            setMaxItems(value);
          }}
        />
      );
    }
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <form>
          <Form />
        </form>
      </I18nextProvider>,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Last 7 days");
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "250" },
    });
    expect(onMaxItemsChange).toHaveBeenLastCalledWith(250);

    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
    expect(screen.getByRole("spinbutton")).toHaveValue(250);
    expect(screen.getByRole("combobox")).toHaveTextContent("最近 7 天");
    expect(container.querySelector("select")?.value).toBe("7-days");
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "2000" },
    });
    expect(onMaxItemsChange).toHaveBeenLastCalledWith(1000);

    await act(async () => {
      await i18n.changeLanguage("en");
    });
    expect(screen.getByRole("spinbutton")).toHaveValue(1000);
    expect(container.querySelector("select")?.value).toBe("7-days");
  });
});
