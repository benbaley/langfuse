import { useTranslation } from "react-i18next";
import { Input } from "@/src/components/ui/input";

export type DateInputRange = {
  from: string;
  to: string;
};

export function DateRangeInput({
  value,
  onValueChange,
  min,
  max,
  fromAriaLabel,
  toAriaLabel,
  disabled,
}: {
  value: DateInputRange;
  onValueChange: (value: DateInputRange) => void;
  min?: string;
  max?: string;
  fromAriaLabel?: string;
  toAriaLabel?: string;
  disabled?: boolean;
}) {
  const { t: tFeatures } = useTranslation("features");
  return (
    <div className="grid w-fit max-w-full grid-cols-[minmax(0,7.5rem)_auto_minmax(0,7.5rem)] items-center gap-2">
      <Input
        aria-label={fromAriaLabel ?? tFeatures("evalsMore:date.start")}
        type="date"
        className="block min-w-0 [&::-webkit-calendar-picker-indicator]:translate-y-px"
        value={value.from}
        min={min}
        max={value.to}
        disabled={disabled}
        onChange={(event) => {
          if (!event.target.value) return;
          onValueChange({ ...value, from: event.target.value });
        }}
      />
      <span className="text-muted-foreground" aria-hidden="true">
        →
      </span>
      <Input
        aria-label={toAriaLabel ?? tFeatures("evalsMore:date.end")}
        type="date"
        className="block min-w-0 [&::-webkit-calendar-picker-indicator]:translate-y-px"
        value={value.to}
        min={value.from}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          if (!event.target.value) return;
          onValueChange({ ...value, to: event.target.value });
        }}
      />
    </div>
  );
}
