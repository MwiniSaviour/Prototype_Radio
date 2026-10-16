import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { IconChevronRight } from "./icons";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  hint?: string;
  options: SelectOption[];
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, options, className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = `${selectId}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-describedby={hint ? hintId : undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-lg border border-line bg-surface px-3.5 pr-10",
            "text-[0.9375rem] text-ink focus-visible:focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-55",
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <IconChevronRight
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted"
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
