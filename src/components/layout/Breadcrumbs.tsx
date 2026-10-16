import { Breadcrumbs as BreadcrumbsBase, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";

/**
 * Site breadcrumbs with the Home crumb prepended automatically.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <BreadcrumbsBase items={[{ label: "Home", href: "/" }, ...items]} className="mb-6" />;
}
