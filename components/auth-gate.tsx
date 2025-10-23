"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { ensureSeller } from "@/lib/api/seller";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [sellerEnsured, setSellerEnsured] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: Session | null } }) => {
        if (!mounted) return;
        setHasSession(!!data.session);
        if (data.session && !sellerEnsured) {
          const u = data.session.user;
          const dn = (u.user_metadata?.name as string) || (u.email?.split("@")[0] || "Seller");
          // Fire-and-forget; do not block readiness
          ensureSeller(dn).finally(() => { if (mounted) setSellerEnsured(true); }).catch(()=>{});
        }
      })
      .catch(() => { if (mounted) setHasSession(false); })
      .finally(() => { if (mounted) setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_: AuthChangeEvent, session: Session | null) => {
      setHasSession(!!session);
      if (session && !sellerEnsured) {
        const u = session.user;
        const dn = (u.user_metadata?.name as string) || (u.email?.split("@")[0] || "Seller");
        ensureSeller(dn).finally(() => setSellerEnsured(true)).catch(()=>{});
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (pathname !== "/login" && !hasSession) router.replace("/login");
    if (pathname === "/login" && hasSession) router.replace("/dashboard");
  }, [ready, hasSession, pathname, router]);

  if (!ready) return <div className="p-6">Loading…</div>;
  if (pathname !== "/login" && !hasSession) return <div className="p-6">Redirecting…</div>;
  return <>{children}</>;
}
