import { NewsFrontPage } from "@/components/news/NewsFrontPage";
import { buildMetadata } from "@/lib/seo";

/**
 * The News section. It is the same edition as the landing page (`/`), so both
 * URLs work and search engines see one canonical newsroom front page.
 */
export const metadata = buildMetadata({
  title: "News",
  description:
    "Prototype Radio's newsroom in Wa: the day's lead story, the latest from every desk, what is on air and what the Upper West Region is reading.",
  path: "/",
});

export default async function NewsPage() {
  return <NewsFrontPage />;
}
