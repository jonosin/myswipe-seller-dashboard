"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useT();
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4 text-neutral-600">
      <ol className="flex items-center gap-2">
        <li>
          <Link href="/dashboard" className="hover:underline">{t("crumbs.home")}</Link>
        </li>
        {parts.map((part, idx) => {
          const href = "/" + parts.slice(0, idx + 1).join("/");
          const isLast = idx === parts.length - 1;
          const label = t(`crumbs.${part}`);
          return (
            <li key={href} className="flex items-center gap-2">
              <span aria-hidden>›</span>
              {isLast ? (
                <span aria-current="page">{label || part}</span>
              ) : (
                <Link href={{ pathname: href }} className="hover:underline">{label || part}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
