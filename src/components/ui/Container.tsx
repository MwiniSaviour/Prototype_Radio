import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "default" | "narrow" | "wide";

const sizes: Record<ContainerSize, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-[88rem]",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { size = "default", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}
      {...props}
    />
  );
});
