import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        title="This page is off air"
        description="The page you were looking for does not exist — it may have been renamed or taken down."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Back to top stories</ButtonLink>
            <ButtonLink href="/search" variant="secondary">
              Search articles
            </ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
