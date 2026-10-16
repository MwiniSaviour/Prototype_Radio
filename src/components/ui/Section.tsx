import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Wrap children in a Container (default true). */
  containered?: boolean;
  containerSize?: "default" | "narrow" | "wide";
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { containered = true, containerSize = "default", className, children, ...props },
  ref,
) {
  return (
    <section ref={ref} className={cn("py-10 sm:py-14", className)} {...props}>
      {containered ? <Container size={containerSize}>{children}</Container> : children}
    </section>
  );
});
