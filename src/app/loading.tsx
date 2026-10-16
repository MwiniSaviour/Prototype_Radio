import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Section aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading stories…</span>
      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <Skeleton height={28} width="40%" className="mb-6" />
          <Skeleton className="mb-8 aspect-[16/9] rounded-card" />
          <div className="grid gap-6 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <aside className="rounded-card border border-line bg-surface p-5">
          <Skeleton height={20} width="50%" className="mb-4" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton height={24} width={24} className="rounded-full" />
                <div className="flex-1">
                  <SkeletonText lines={2} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <Container className="sr-only">
        <Skeleton height={1} />
      </Container>
    </Section>
  );
}
