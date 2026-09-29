// @vitest-environment node

import { describe, expect, it } from "vitest";

import Decimal from "decimal.js";

import {
  compactNumberFormatter,
  numberFormatter,
  usdFormatter,
  costFormatter,
  latencyFormatter,
} from "@/src/utils/numbers";

describe("costFormatter", () => {
  it("formats dashboard costs with cent precision", () => {
    expect(costFormatter(4.402973)).toBe("$4.40");
    expect(costFormatter(0.068415)).toBe("$0.07");
    expect(costFormatter(0.015427)).toBe("$0.02");
    expect(costFormatter(0)).toBe("$0.00");
  });
});

describe("explicit display locale", () => {
  it("uses Chinese compact units while preserving numeric precision and USD currency", () => {
    expect(compactNumberFormatter(12345, 2, "zh-CN")).toBe("1.23万");
    expect(compactNumberFormatter(12345, 2)).toBe("12.35K");
    expect(numberFormatter(12345.678, 2, 3, "zh-CN")).toBe("12,345.678");
    const cost = new Decimal("1234.5678");
    expect(usdFormatter(cost, 2, 4, "zh-CN")).toBe("US$1,234.5678");
    expect(usdFormatter(cost, 2, 4)).toBe("$1,234.5678");
    expect(cost.toString()).toBe("1234.5678");
    expect(costFormatter(4.402973, "zh-CN")).toBe("US$4.40");
  });

  it("retains duration scaling when displaying localized units", () => {
    expect(latencyFormatter(1500, "zh-CN")).toBe("1.5秒");
    expect(latencyFormatter(1500)).toBe("1.5s");
  });
});
