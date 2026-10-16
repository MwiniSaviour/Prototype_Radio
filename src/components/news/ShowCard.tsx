import Image from "next/image";
import Link from "next/link";
import type { Show } from "@/lib/types";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { IconHeadphones } from "@/components/ui/icons";

export interface ShowCardProps {
  show: Show;
  className?: string;
}

export function ShowCard({ show, className }: ShowCardProps) {
  return (
    <article
      id={show.slug}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-line bg-surface",
        "transition-[border-color,box-shadow] duration-200 hover:border-ink/20 hover:shadow-card",
        className,
      )}
    >
      <Link href={`/shows#${show.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          <Image
            src={show.image.src}
            alt={show.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.035]"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg leading-tight font-bold text-ink group-hover:text-brand motion-safe:transition-colors">
          <Link href={`/shows#${show.slug}`} className="rounded-sm focus-visible:focus-ring">
            {show.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {show.tagline}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {show.schedule.slice(0, 3).map((slot) => (
            <Badge key={`${slot.day}-${slot.start}`} variant="neutral" size="sm">
              <span className="capitalize">{slot.day.slice(0, 3)}</span>
              <span className="tabular-nums">{formatClock(slot.start)}</span>
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <span className="flex -space-x-2">
            {show.hosts.map((host) => (
              <Avatar
                key={host.id}
                name={host.name}
                src={host.avatarUrl}
                size="xs"
                className="ring-2 ring-paper"
              />
            ))}
          </span>
          <p className="truncate text-xs text-muted">
            with {show.hosts.map((host) => host.name).join(" & ")}
          </p>
          <IconHeadphones className="ml-auto h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
