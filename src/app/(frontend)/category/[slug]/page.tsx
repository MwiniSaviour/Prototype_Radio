import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArticleGrid } from "@/components/news/ArticleGrid";
import { CategoryNav } from "@/components/news/CategoryNav";
import { Container } from "@/components/ui/Container";
import { getArticlesByCategory, getCategories, getCategoryBySlug } from "@/content";
import { buildMetadata } from "@/lib/seo";
import { pluralize } from "@/lib/format";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return buildMetadata({ title: "Category not found", noindex: true });
  }

  return buildMetadata({
    title: category.name,
    description: category.description,
    path: `/category/${category.slug}`,
    keywords: [category.name],
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryArticles = await getArticlesByCategory(category);
  const categories = await getCategories();

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: "Categories", href: "/category" },
          { label: category.name },
        ]}
      />

      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          {pluralize(categoryArticles.length, "story", "stories")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {category.name}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          {category.description}
        </p>
      </header>

      <div className="mt-6 border-y border-line py-4">
        <CategoryNav categories={categories} activeSlug={category.slug} />
      </div>

      <section aria-label={`${category.name} stories`} className="mt-8">
        <h2 className="sr-only">All {category.name} stories</h2>
        <ArticleGrid
          articles={categoryArticles}
          variant="default"
          columns={2}
          emptyTitle={`No ${category.name} stories yet`}
          emptyDescription="This desk is still warming up. Check back shortly."
        />
      </section>
    </Container>
  );
}
