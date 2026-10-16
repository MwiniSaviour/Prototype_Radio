import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NewsletterSignup } from "@/components/news/NewsletterSignup";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Divider";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAuthors, getShows } from "@/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "Who Radio Waa is, how the newsroom works, and how to reach us. Our editorial standards are published in full.",
  path: "/about",
});

const principles = [
  {
    title: "We say who we spoke to",
    body: "Every story names its sources when it can, and explains itself when it cannot. Anonymous sourcing is a last resort, approved by an editor, and explained in the piece.",
  },
  {
    title: "We correct out loud",
    body: "Corrections appear at the top of the article, dated, with a note on what changed. We do not quietly edit a published story.",
  },
  {
    title: "The pledge stays cheap",
    body: "Membership and pledges fund the newsroom, not advertisers. Sponsorship is labelled, and no sponsor gets a say in coverage.",
  },
  {
    title: "The schedule is a promise",
    body: "Shows start on time and the archive stays up. If a broadcast is delayed, the schedule page says so.",
  },
];

export default async function AboutPage() {
  const authors = await getAuthors();
  const shows = await getShows();

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs items={[{ label: "About" }]} />

        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Est. 2016 · Independent
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Radio Waa is a station built out of its own call-in.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            We started with one transmitter, a borrowed studio and a phone line that
            rang more than it stopped. Ten years on, the principle has not changed:
            the station is whatever its listeners make of it — and the newsroom is
            accountable to them, not to anyone else.
          </p>
        </header>

        <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { value: "24/7", label: "Hours on air" },
            { value: String(shows.length), label: "Shows a week" },
            { value: "61k", label: "Weekly listeners" },
            { value: "10 yrs", label: "On air" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-card border border-line bg-surface p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {stat.label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Section aria-labelledby="standards-heading" className="bg-surface-2/60">
        <SectionHeading
          id="standards-heading"
          eyebrow="Editorial standards"
          title="How we work"
          description="These rules bind everyone who publishes under our name, including this website."
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {principles.map((principle) => (
            <article key={principle.title} id={principle.title.toLowerCase().replace(/\s+/g, "-")} className="rounded-card border border-line bg-surface p-5">
              <h3 className="font-display text-lg font-bold text-ink">{principle.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{principle.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section aria-labelledby="team-heading">
        <SectionHeading
          id="team-heading"
          eyebrow="The newsroom"
          title="Who you hear on air"
        />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <li
              key={author.id}
              className="flex items-center gap-3 rounded-card border border-line bg-surface p-4"
            >
              <Avatar name={author.name} src={author.avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-ink">{author.name}</p>
                <p className="text-sm text-muted">{author.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="contact-heading">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              id="contact-heading"
              eyebrow="Contact"
              title="Reach the newsroom"
            />
            <Divider className="my-6" />
            <address className="flex flex-col gap-3 text-sm not-italic text-muted">
              <p>
                <span className="font-semibold text-ink">Studio:</span> The Granary,
                Riverfront — call the request line any time the lights are on.
              </p>
              <p>
                <span className="font-semibold text-ink">Email:</span>{" "}
                <a
                  href="mailto:newsroom@radio-waa.example"
                  className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:focus-ring"
                >
                  newsroom@radio-waa.example
                </a>
              </p>
              <p>
                <span className="font-semibold text-ink">Corrections:</span>{" "}
                <a
                  href="mailto:corrections@radio-waa.example"
                  className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:focus-ring"
                >
                  corrections@radio-waa.example
                </a>
              </p>
            </address>
          </div>
          <NewsletterSignup />
        </div>
      </Section>
    </>
  );
}
