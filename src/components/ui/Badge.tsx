import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "brand" | "accent" | "outline";
type BadgeSize = "sm" | "md";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-2 text-ink",
  brand: "bg-brand-soft text-brand-on-soft",
  accent: "bg-accent/12 text-accent",
  outline: "border border-line text-ink",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[0.6875rem]",
  md: "px-2.5 py-1 text-xs",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/** Tag = a plain Badge with sentence casing, used for article keywords. */
export function Tag({ className, ...props }: BadgeProps) {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn("normal-case tracking-normal font-medium", className)}
      {...props}
    />
  );
}
