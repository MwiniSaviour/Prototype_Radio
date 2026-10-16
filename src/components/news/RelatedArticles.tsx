import type { Article } from "@/lib/types";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArticleGrid } from "./ArticleGrid";

export interface RelatedArticlesProps {
  articles: Article[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <Section aria-labelledby="related-heading" className="border-t border-line">
      <SectionHeading
        id="related-heading"
        eyebrow="Keep reading"
        title="Related stories"
        description="More from the desk that filed this one."
      />
      <ArticleGrid articles={articles} variant="default" columns={3} className="mt-6" />
    </Section>
  );
}
