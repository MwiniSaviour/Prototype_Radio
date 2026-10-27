import Link from "next/link";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface CategoryNavProps {
  categories: Category[];
  /** Slug of the category being viewed; "Top stories" is highlighted when undefined. */
  activeSlug?: string;
  className?: string;
}

export function CategoryNav({ categories, activeSlug, className }: CategoryNavProps) {
  const links = [{ label: "Top stories", href: "/", slug: undefined }, ...categories.map((c) => ({ label: c.name, href: `/category/${c.slug}`, slug: c.slug }))];

  return (
    <nav aria-label="Categories" className={cn("min-w-0", className)}>
      <ul className="no-scrollbar flex gap-2 overflow-x-auto py-1">
        {links.map((link) => {
          const active = activeSlug === link.slug || (activeSlug === undefined && link.slug === undefined);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex rounded-[3px] border px-3 py-[6px] text-[11.5px] font-semibold tracking-[0.06em] uppercase",
                  "transition-colors duration-150 focus-visible:focus-ring",
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink/80 hover:border-line-strong hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
