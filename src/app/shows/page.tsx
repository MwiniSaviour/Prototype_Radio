import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NewsletterSignup } from "@/components/news/NewsletterSignup";
import { ShowCard } from "@/components/news/ShowCard";
import { ShowSchedule } from "@/components/news/ShowSchedule";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getShows } from "@/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shows & programmes",
  description:
    "The Radio Waa weekly schedule: breakfast reporting, drive-time culture, Friday-night music, Saturday sport and the Sunday documentary.",
  path: "/shows",
});

export default async function ShowsPage() {
  const shows = await getShows();

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "Shows" }]} />

        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Shows &amp; programmes
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            {shows.length} shows a week, every one of them made in-house. The schedule below
            is live: today&apos;s rows are highlighted, and every show page links back here.
          </p>
        </header>

        <Section aria-labelledby="schedule-heading" containered={false} className="py-10">
          <SectionHeading
            id="schedule-heading"
            eyebrow="This week"
            title="Broadcast schedule"
            description="All times are local. Today is marked in the table."
          />
          <ShowSchedule shows={shows} className="mt-6" />
        </Section>
      </Container>

      <Section aria-labelledby="all-shows-heading" className="bg-surface-2/60">
        <SectionHeading
          id="all-shows-heading"
          eyebrow="The roster"
          title="Every show"
          description="Who is on air, when, and what you will hear."
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} className="h-full scroll-mt-32" />
          ))}
        </div>
      </Section>

      <Section>
        <NewsletterSignup
          heading="Never miss a show"
          description="Get the weekly schedule in your inbox every Sunday evening."
        />
      </Section>
    </>
  );
}
