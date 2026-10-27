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
    <Container className="pt-5 pb-10">
      <Breadcrumbs
        items={[
          { label: "Categories", href: "/category" },
          { label: category.name },
        ]}
      />

      <header className="max-w-3xl">
        <p className="text-[10.5px] font-bold tracking-[0.14em] text-brand uppercase">
          {pluralize(categoryArticles.length, "story", "stories")}
        </p>
        <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-bold tracking-[-0.012em] text-ink sm:text-[40px]">
          {category.name}
        </h1>
        <p className="mt-2.5 text-[14px] leading-[1.55] text-muted">{category.description}</p>
      </header>

      <div className="mt-6 border-y border-line py-3">
        <CategoryNav categories={categories} activeSlug={category.slug} />
      </div>

      <section aria-label={`${category.name} stories`} className="mt-7">
        <h2 className="sr-only">All {category.name} stories</h2>
        <ArticleGrid
          articles={categoryArticles}
          variant="default"
          columns={3}
          emptyTitle={`No ${category.name} stories yet`}
          emptyDescription="This desk is still warming up. Check back shortly."
        />
      </section>
    </Container>
  );
}
