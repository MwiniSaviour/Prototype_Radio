import type { FieldHook } from "payload";

// Slugs must be URL-safe and stable while their sources (titles, names) contain
// spaces and punctuation. Normalization happens on create (optionally deriving
// from the source); update never re-derives, so live URLs survive source edits.
const slugify = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function createSlugHook(sourceField: string): FieldHook {
  return ({ data, value, operation }) => {
    if (operation === "update") {
      // Slugs are durable URLs: normalize only a non-empty value and leave the
      // field untouched when the update did not touch it at all.
      return typeof value === "string" && value.trim().length > 0
        ? slugify(value)
        : undefined;
    }

    // Create: fall back to the source field when the caller left the slug empty
    // (source values are guarded — they may be absent on partial writes).
    const raw =
      typeof value === "string" && value.trim().length > 0
        ? value
        : typeof data?.[sourceField] === "string"
          ? (data[sourceField] as string)
          : "";
    return slugify(raw);
  };
}
