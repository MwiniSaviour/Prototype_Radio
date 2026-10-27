import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@/components/ui/icons";

/**
 * The rail's coverage index. Regions are search terms, not a separate
 * taxonomy: each row links to the archive filtered for that place, so nothing
 * here points at a route the newsroom cannot serve.
 */
const REGIONS = ["Upper West", "Wa Municipal", "Jirapa", "Lawra"];

export function RegionList({ className }: { className?: string }) {
  return (
    <section aria-labelledby="regions-heading" className={cn("border-t border-line pt-4", className)}>
      <h2
        id="regions-heading"
        className="text-[11px] font-bold tracking-[0.14em] text-ink uppercase"
      >
        Local &amp; regional
      </h2>

      <ul className="mt-1">
        {REGIONS.map((region) => (
          <li key={region} className="border-b border-line/80 last:border-b-0">
            <Link
              href={`/search?q=${encodeURIComponent(region)}`}
              className="group flex items-center justify-between gap-3 py-3 text-[13px] text-ink transition-colors hover:text-brand"
            >
              {region}
              <IconArrowRight
                className="h-3.5 w-3.5 shrink-0 text-ink/45 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
