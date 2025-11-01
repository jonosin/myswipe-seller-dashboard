"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Package, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const open = useAppStore((s) => s.sidebarOpen);

  if (pathname === "/login") return null;

  return (
    <aside
      className={cn(
        "bg-white border-r border-neutral-200 w-64 shrink-0 hidden sm:block", 
        open ? "block" : "hidden sm:block"
      )}
      aria-label="Sidebar navigation"
    >
      <nav className="p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={{ pathname: href }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 border border-transparent hover:border-neutral-200",
                active && "border-neutral-900"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
