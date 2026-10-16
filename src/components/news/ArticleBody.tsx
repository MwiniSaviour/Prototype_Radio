import type { ArticleBlock } from "@/lib/types";

export interface ArticleBodyProps {
  blocks: ArticleBlock[];
}

/**
 * Renders the article's structured content blocks as semantic HTML. Types are
 * exhaustive over ArticleBlock, so new block kinds fail to compile until they
 * are handled here.
 */
export function ArticleBody({ blocks }: ArticleBodyProps) {
  return (
    <div className="mt-8 flex flex-col gap-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={index}
                className="mt-4 font-display text-2xl leading-tight font-bold tracking-tight text-ink"
              >
                {block.text}
              </h2>
            ) : (
              <h3 key={index} className="mt-2 font-display text-xl font-bold text-ink">
                {block.text}
              </h3>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-4 border-brand pl-5"
              >
                <p className="font-display text-xl leading-relaxed text-ink italic">
                  “{block.text}”
                </p>
                {block.attribution ? (
                  <footer className="mt-2 text-sm text-muted">— {block.attribution}</footer>
                ) : null}
              </blockquote>
            );

          case "list":
            return block.ordered ? (
              <ol key={index} className="ml-6 list-decimal space-y-2 text-[1.0625rem] leading-relaxed text-ink marker:text-brand marker:font-semibold">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul key={index} className="ml-6 list-disc space-y-2 text-[1.0625rem] leading-relaxed text-ink marker:text-brand">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            );

          case "paragraph":
            return index === 0 ? (
              <p key={index} className="text-lg leading-relaxed font-medium text-ink sm:text-xl">
                {block.text}
              </p>
            ) : (
              <p key={index} className="text-[1.0625rem] leading-relaxed text-ink/90">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
