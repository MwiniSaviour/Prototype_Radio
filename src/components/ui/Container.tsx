import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ContainerSize = "default" | "narrow" | "wide";

const sizes: Record<ContainerSize, string> = {
  /**
   * 1330px box with 40px gutters: at 1536 the content edges land on 143/1393,
   * the measure the reference front page uses.
   */
  default: "max-w-[83.125rem]",
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
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-10", sizes[size], className)}
      {...props}
    />
  );
});
