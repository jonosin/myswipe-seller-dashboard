"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (pathname !== "/login" && !isAuthenticated) {
      router.replace("/login");
    }
  }, [pathname, isAuthenticated, router]);

  if (pathname !== "/login" && !isAuthenticated) {
    return <div className="p-6">Redirecting…</div>;
  }

  return <>{children}</>;
}
