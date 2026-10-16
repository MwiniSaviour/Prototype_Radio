import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArticleGrid } from "@/components/news/ArticleGrid";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSearch } from "@/components/ui/icons";
import { searchArticles } from "@/content";
import { buildMetadata } from "@/lib/seo";
import { pluralize } from "@/lib/format";

export const metadata = buildMetadata({
  title: "Search",
  description: "Search every Radio Waa story by keyword, topic or tag.",
  path: "/search",
  noindex: true,
});

type SearchPageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchArticles(query) : [];

  return (
    <Container className="py-8">
      <Breadcrumbs items={[{ label: "Search" }]} />

      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Search the archive
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Find stories by keyword, topic or tag. Search runs on every published
          article — try “transmitters”, “football” or “podcasts”.
        </p>
      </header>

      <form
        action="/search"
        method="get"
        role="search"
        className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-end"
      >
        <Input
          type="search"
          name="q"
          label="Search articles"
          placeholder="transmitters, football, podcasts…"
          defaultValue={query}
          autoComplete="off"
          wrapperClassName="flex-1"
        />
        <Button type="submit">
          <IconSearch className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      <div aria-live="polite" className="mt-8">
        {query ? (
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            {pluralize(results.length, "result")} for “{query}”
          </h2>
        ) : null}
      </div>

      {query ? (
        <div className="mt-6">
          <ArticleGrid
            articles={results}
            variant="default"
            columns={2}
            emptyTitle={`No results for “${query}”`}
            emptyDescription="Try a shorter phrase, or browse the category pages for every desk."
          />
        </div>
      ) : null}
    </Container>
  );
}
