import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

// revalidatePath throws outside a Next request context (e.g.
// `payload run scripts/seed.ts`). Swallowing keeps scripts alive; the hourly
// ISR window (revalidate = 3600) covers the missed purge.
const purge = (paths: readonly string[]): void => {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Best effort only — see the note above.
    }
  }
};

// Payload 3 config hook properties are arrays, so the factory returns arrays
// and collection configs assign them directly.
export function createRevalidateHooks(
  pathsFor: (doc: Record<string, unknown>) => string[],
): {
  afterChange: CollectionAfterChangeHook[];
  afterDelete: CollectionAfterDeleteHook[];
} {
  return {
    afterChange: [
      ({ doc }) => {
        const record = doc as Record<string, unknown>;
        // Drafts/autosaves must not purge published caches; guarding on the
        // property's existence keeps unversioned collections on the same path.
        if ("_status" in record && record._status !== "published") {
          return;
        }
        purge(Array.from(new Set([...pathsFor(record), "/sitemap.xml"])));
      },
    ],
    afterDelete: [
      ({ doc }) => {
        // No draft check here: deleting a published doc must purge its caches too.
        purge(Array.from(new Set([...pathsFor(doc as Record<string, unknown>), "/sitemap.xml"])));
      },
    ],
  };
}
