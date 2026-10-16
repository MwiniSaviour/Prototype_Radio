"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the browser console; swap for real error reporting later.
    console.error(error);
  }, [error]);

  return (
    <Container className="py-20">
      <EmptyState
        title="Something went wrong"
        description={
          error.digest
            ? `The page failed to load. Reference: ${error.digest}.`
            : "The page failed to load. You can try again, or head back to the front page."
        }
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Back to top stories
            </ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
