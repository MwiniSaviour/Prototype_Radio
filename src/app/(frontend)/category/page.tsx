import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { pluralize } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { getArticles, getCategories } from "@/content";

export const metadata = buildMetadata({
  title: "Categories",
  description: "Every desk at W93.5 FM: news, music, culture, sport, tech and community.",
  path: "/category",
});

export default async function CategoryIndexPage() {
  const categories = await getCategories();
  const articles = await getArticles();

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Categories" }]} />

      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Categories
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Six desks, one newsroom. Pick a desk to see everything it has filed.
        </p>
      </header>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const count = articles.filter(
            (article) => article.category.id === category.id,
          ).length;

          return (
            <li key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-pop focus-visible:focus-ring"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  {pluralize(count, "story", "stories")}
                </span>
                <h2 className="mt-2 font-display text-xl font-bold text-ink group-hover:text-brand motion-safe:transition-colors">
                  {category.name}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                  {category.description}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
