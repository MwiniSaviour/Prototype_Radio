import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconChevronRight } from "./icons";

export interface BreadcrumbItem {
  label: string;
  /** Omitted for the current page, which renders as plain text. */
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  { items, className, ...props },
  ref,
) {
  return (
    <nav ref={ref} aria-label="Breadcrumb" className={cn("min-w-0", className)} {...props}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-sm hover:text-ink hover:underline focus-visible:focus-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-ink">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <IconChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted/60" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
