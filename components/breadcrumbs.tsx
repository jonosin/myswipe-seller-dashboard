"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  shipping: "Shipping",
  payouts: "Payouts",
  settings: "Settings",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4 text-neutral-600">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/dashboard" className="hover:underline">Home</Link>
        </li>
        {parts.map((part, idx) => {
          const href = "/" + parts.slice(0, idx + 1).join("/");
          const isLast = idx === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-2">
              <span aria-hidden>›</span>
              {isLast ? (
                <span aria-current="page">{LABELS[part] || part}</span>
              ) : (
                <Link href={{ pathname: href }} className="hover:underline">{LABELS[part] || part}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
