import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";
import { ArticleBody } from "@/components/news/ArticleBody";
import { NewsletterSignup } from "@/components/news/NewsletterSignup";
import { RelatedArticles } from "@/components/news/RelatedArticles";
import { ShareBar } from "@/components/news/ShareBar";
import { Byline } from "@/components/news/Byline";
import { Badge, Tag } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getArticles, getArticleBySlug, getRelatedArticles } from "@/content";
import { formatDateTime } from "@/lib/format";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({ title: "Story not found", noindex: true });
  }

  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/article/${article.slug}`,
    image: article.image.src,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt ?? article.publishedAt,
    authors: [article.author.name],
    keywords: article.tags,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article);
  const shareUrl = absoluteUrl(`/article/${article.slug}`);

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: article.category.name, href: `/category/${article.category.slug}` },
            { label: article.title },
          ]}
        />

        <article className="mx-auto max-w-3xl">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="brand">{article.category.name}</Badge>
              {article.breaking ? (
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider text-brand-fg">
                  Breaking
                </span>
              ) : null}
              <time
                dateTime={article.publishedAt}
                className="text-xs text-muted"
              >
                {formatDateTime(article.publishedAt)}
              </time>
            </div>

            <h1 className="font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {article.title}
            </h1>

            <p className="text-lg leading-relaxed text-muted sm:text-xl">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
              <Byline
                author={article.author}
                publishedAt={article.publishedAt}
                readingMinutes={article.readingMinutes}
                updatedAt={article.updatedAt}
              />
              <ShareBar url={shareUrl} title={article.title} />
            </div>
          </header>

          <figure className="mt-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-card border border-line bg-surface-2">
              <Image
                src={article.image.src}
                alt={article.image.alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 48rem"
                className="object-cover"
              />
            </div>
            {article.image.credit ? (
              <figcaption className="mt-2 text-xs text-muted">
                {article.image.credit}
              </figcaption>
            ) : null}
          </figure>

          <ArticleBody blocks={article.body} />

          <footer className="mt-10 flex flex-col gap-6 border-t border-line pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Filed under
              </span>
              {article.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-4">
              <Avatar name={article.author.name} src={article.author.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{article.author.name}</p>
                <p className="text-sm text-muted">{article.author.role}</p>
              </div>
              <ButtonLink href="/about#team" variant="secondary" size="sm">
                About the newsroom
              </ButtonLink>
            </div>

            <ShareBar url={shareUrl} title={article.title} />
          </footer>
        </article>
      </Container>

      <Reveal>
        <RelatedArticles articles={related} />
      </Reveal>

      <Section>
        <NewsletterSignup />
      </Section>
    </>
  );
}
