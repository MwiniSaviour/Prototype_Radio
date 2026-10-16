import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const headingTags = { h2: "h2", h3: "h3", h4: "h4" } as const;
type HeadingTag = keyof typeof headingTags;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a lift + focus-within ring so the whole card feels actionable. */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-line bg-surface",
        interactive &&
          "transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-pop focus-within:focus-ring",
        className,
      )}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-1.5 p-5", className)} {...props} />;
  },
);

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { as?: HeadingTag }
>(function CardTitle({ className, as = "h3", ...props }, ref) {
  const Tag = headingTags[as];
  return (
    <Tag
      ref={ref}
      className={cn("font-display text-lg leading-tight font-bold text-ink", className)}
      {...props}
    />
  );
});

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn("text-sm leading-relaxed text-muted", className)} {...props} />;
});

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3 border-t border-line px-5 py-3", className)}
        {...props}
      />
    );
  },
);
