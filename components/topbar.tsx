"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useT } from "@/lib/i18n";

export default function Topbar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const pathname = usePathname();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const { t } = useT();

  useEffect(() => {
    let mounted = true;
    const BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
    if (BYPASS) {
      setHasSession(false);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        setHasSession(!!data.session);
      })
      .catch(() => {
        if (!mounted) return;
        setHasSession(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      setHasSession(!!session);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-neutral-200">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <button aria-label="Toggle navigation" onClick={toggleSidebar} className="inline-flex items-center justify-center rounded-md border border-neutral-300 p-2 sm:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/products" className="inline-flex items-center gap-2" aria-label="MySwipes Home">
          <Image src="/myswipes-logo.svg" alt="MySwipes" width={112} height={20} className="h-5 w-auto" priority />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {hasSession && (
            <button
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm"
              onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
            >
              {t("common.signOut")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
