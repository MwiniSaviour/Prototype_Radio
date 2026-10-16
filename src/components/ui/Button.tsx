import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

const base = [
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
  "transition-[background-color,color,border-color,box-shadow,transform] duration-150",
  "focus-visible:focus-ring",
  "disabled:cursor-not-allowed disabled:opacity-55",
  "active:scale-[0.98] motion-reduce:active:scale-100",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-fg shadow-card hover:bg-brand-hover",
  secondary:
    "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-110",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-7 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonOwnProps = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonOwnProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button(
  { variant, size, fullWidth, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
});

export const ButtonLink = forwardRef<
  HTMLAnchorElement,
  ButtonOwnProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof ButtonOwnProps
  >
>(function ButtonLink({ variant, size, fullWidth, className, ...props }, ref) {
  return (
    <Link
      ref={ref}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
});
