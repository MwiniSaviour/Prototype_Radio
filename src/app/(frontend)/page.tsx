import { NewsFrontPage } from "@/components/news/NewsFrontPage";
import { buildMetadata } from "@/lib/seo";

/**
 * `/` is the newsroom front page — the landing screen, exactly as the app's
 * first tab is News. The page itself lives in components/news/NewsFrontPage so
 * `/news` can render the same edition instead of a second copy.
 */
export const metadata = buildMetadata({
  title: "News",
  description:
    "Prototype Radio's newsroom in Wa: the day's lead story, the latest from every desk, what is on air and what the Upper West Region is reading.",
  path: "/",
});

export default async function HomePage() {
  return <NewsFrontPage />;
}
