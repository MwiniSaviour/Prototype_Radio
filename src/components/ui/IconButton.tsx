import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface IconButtonOwnProps {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "outline";
  className?: string;
}

const sizes = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

const variants = {
  ghost: "text-ink hover:bg-surface-2",
  solid: "bg-brand text-brand-fg hover:bg-brand-hover",
  outline: "border border-line bg-surface text-ink hover:bg-surface-2",
} as const;

interface IconButtonStyleProps {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid" | "outline";
  className?: string;
}

function iconButtonClasses({
  size = "md",
  variant = "ghost",
  className,
}: IconButtonStyleProps): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full",
    "transition-[background-color,color,border-color] duration-150",
    "focus-visible:focus-ring",
    "disabled:cursor-not-allowed disabled:opacity-55",
    sizes[size],
    variants[variant],
    className,
  );
}

/** Icon-only control. `label` is required — it becomes the accessible name. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  IconButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function IconButton(
  { label, size, variant, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={iconButtonClasses({ label, size, variant, className })}
      {...props}
    />
  );
});

export const IconButtonLink = forwardRef<
  HTMLAnchorElement,
  IconButtonOwnProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof IconButtonOwnProps
  >
>(function IconButtonLink({ label, size, variant, className, ...props }, ref) {
  return (
    <Link
      ref={ref}
      aria-label={label}
      title={label}
      className={iconButtonClasses({ label, size, variant, className })}
      {...props}
    />
  );
});
