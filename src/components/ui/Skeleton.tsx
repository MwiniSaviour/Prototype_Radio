import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional intrinsic dimensions; without them the skeleton fills its parent. */
  width?: number | string;
  height?: number | string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, width, height, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ width, height, ...style }}
      className={cn("motion-safe:animate-pulse rounded-md bg-surface-2", className)}
      {...props}
    />
  );
});

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={12}
          className={index === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-line bg-surface", className)}>
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton height={12} width="35%" />
        <Skeleton height={20} width="90%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
