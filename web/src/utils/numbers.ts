import Decimal from "decimal.js";

export const compactNumberFormatter = (
  number?: number | bigint,
  maxFractionDigits?: number,
  locale = "en-US",
) => {
  return Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: maxFractionDigits ?? 2,
  }).format(number ?? 0);
};

export const numberFormatter = (
  number?: number | bigint,
  fractionDigits?: number,
  maxFractionDigits?: number,
  locale = "en-US",
) => {
  return Intl.NumberFormat(locale, {
    notation: "standard",
    useGrouping: true,
    minimumFractionDigits: fractionDigits ?? 2,
    maximumFractionDigits: maxFractionDigits ?? fractionDigits ?? 2,
  }).format(number ?? 0);
};

const durationDivisors = [1, 1_000, 60_000, 3_600_000, 86_400_000] as const;

const durationUnits = [
  "millisecond",
  "second",
  "minute",
  "hour",
  "day",
] as const;

const createDurationFormatter = (
  unit: (typeof durationUnits)[number],
  locale: string,
) =>
  Intl.NumberFormat(locale, {
    style: "unit",
    unit: unit,
    unitDisplay: "narrow",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const durationFormatters = durationUnits.map((unit) =>
  createDurationFormatter(unit, "en-US"),
);

const selectDurationFormatter = (
  milliseconds: number | bigint,
  locale: string,
): [Intl.NumberFormat, number] => {
  const ms = Number(milliseconds);
  const tier = durationDivisors.reduce(
    (acc, divisor, i) => (Math.abs(ms) >= divisor ? i : acc),
    0,
  );
  return [
    locale === "en-US"
      ? durationFormatters[tier]
      : createDurationFormatter(durationUnits[tier], locale),
    ms / durationDivisors[tier]!,
  ];
};

export const latencyFormatter = (
  milliseconds?: number,
  locale = "en-US",
): string => {
  const [fmt, value] = selectDurationFormatter(milliseconds ?? 0, locale);
  return fmt.format(value ?? 0);
};

export const usdFormatter = (
  number?: number | bigint | Decimal,
  minimumFractionDigits = 2,
  maximumFractionDigits = 6,
  locale = "en-US",
) => {
  const numberToFormat = number instanceof Decimal ? number.toNumber() : number;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits
    minimumFractionDigits,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumfractiondigits
    maximumFractionDigits,
  }).format(numberToFormat ?? 0);
};

export const costFormatter = (totalCost?: number, locale = "en-US") => {
  return usdFormatter(totalCost, 2, 2, locale);
};

export const formatTokenCounts = (
  inputUsage?: number | null,
  outputUsage?: number | null,
  totalUsage?: number | null,
  showLabels = false,
): string => {
  if (!inputUsage && !outputUsage && !totalUsage) return "";

  return showLabels
    ? `${numberFormatter(inputUsage ?? 0, 0)} prompt → ${numberFormatter(outputUsage ?? 0, 0)} completion (∑ ${numberFormatter(totalUsage ?? 0, 0)})`
    : `${numberFormatter(inputUsage ?? 0, 0)} → ${numberFormatter(outputUsage ?? 0, 0)} (∑ ${numberFormatter(totalUsage ?? 0, 0)})`;
};
