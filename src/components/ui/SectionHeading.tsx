import { cn } from "@/lib/utils";
import { ButtonLink } from "./Button";
import { IconArrowRight } from "./icons";

const headingTags = { h1: "h1", h2: "h2", h3: "h3" } as const;
type HeadingTag = keyof typeof headingTags;

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Renders a trailing link, e.g. "All shows" -> /shows. */
  action?: { label: string; href: string };
  as?: HeadingTag;
  id?: string;
  className?: string;
  headingClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as = "h2",
  id,
  className,
  headingClassName,
}: SectionHeadingProps) {
  const Heading = headingTags[as];
  const headingId = id ?? (eyebrow ? `section-${eyebrow.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          id={headingId}
          className={cn(
            "font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl",
            headingClassName,
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? (
        <ButtonLink
          href={action.href}
          variant="ghost"
          size="sm"
          className="-mr-3 text-brand"
        >
          {action.label}
          <IconArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      ) : null}
    </div>
  );
}
