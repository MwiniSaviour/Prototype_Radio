import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  /** When set, renders the label centred between two rules. */
  label?: string;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { label, className, ...props },
  ref,
) {
  if (!label) {
    return <hr ref={ref} className={cn("border-0 border-t border-line", className)} {...props} />;
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <hr className="flex-1 border-0 border-t border-line" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <hr className="flex-1 border-0 border-t border-line" />
    </div>
  );
});
