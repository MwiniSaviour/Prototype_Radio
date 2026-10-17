/**
 * Resolve hook for running TypeScript entry points under Node's native type
 * stripping on this host.
 *
 * Payload's CLI runs with `--disable-transpile`, which hands module loading to
 * Node instead of tsx (tsx crashes here: it double-loads undici's internal
 * symbols and dies with "Illegal constructor"). Native stripping erases types
 * but does not do extensionless resolution, so `import "./collections/Articles"`
 * fails with ERR_MODULE_NOT_FOUND. This retries failed relative resolutions
 * with the TypeScript extensions and directory-index forms. Bare package
 * subpaths need the same fallback because some packages (e.g. `next/cache`)
 * are only mapped by their bundler, never in a package exports field.
 */

import { registerHooks } from "node:module";

const CANDIDATES = [".ts", ".tsx", ".mts", "/index.ts", "/index.tsx"];
const SUBPATH_CANDIDATES = [".js", ".mjs"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    if (!isRelative) {
      try {
        return nextResolve(specifier, context);
      } catch (error) {
        for (const candidate of SUBPATH_CANDIDATES) {
          try {
            return nextResolve(specifier + candidate, context);
          } catch {
            // Try the next candidate form before giving up.
          }
        }
        throw error;
      }
    }

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      for (const candidate of CANDIDATES) {
        try {
          return nextResolve(specifier + candidate, context);
        } catch {
          // Try the next candidate form before giving up.
        }
      }
      throw error;
    }
  },
});
