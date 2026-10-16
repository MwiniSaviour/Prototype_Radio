import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? <div className="text-muted">{icon}</div> : null}
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
