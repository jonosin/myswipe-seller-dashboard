"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Menu } from "lucide-react";

export default function Topbar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-neutral-200">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <button aria-label="Toggle navigation" onClick={toggleSidebar} className="inline-flex items-center justify-center rounded-md border border-neutral-300 p-2 sm:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="font-semibold tracking-tight">Myswipe</Link>
        <div className="ml-auto text-sm text-neutral-600">Demo Seller</div>
      </div>
    </header>
  );
}
