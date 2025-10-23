"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Completing sign-in…");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const href = window.location.href;
        const url = new URL(href);
        const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
        const h = new URLSearchParams(hash);
        const q = url.searchParams;
        const err = q.get('error') || h.get('error');
        const errDesc = q.get('error_description') || h.get('error_description');
        if (err) { setMessage(`Sign-in failed: ${errDesc || err}`); return; }

        // 1) Try URL-based exchange (supabase-js parses code/tokens internally)
        const ex1 = await (supabase.auth as any).exchangeCodeForSession(href);
        if (!mounted) return;
        if (!ex1?.error) { router.replace('/dashboard'); return; }

        // 2) Fallback: explicit code param exchange
        const code = q.get('code') || h.get('code');
        if (code) {
          const ex2 = await (supabase.auth as any).exchangeCodeForSession(code);
          if (!mounted) return;
          if (!ex2?.error) { router.replace('/dashboard'); return; }
        }

        // 3) Fallback: token-based setSession (magic link style)
        const access_token = q.get('access_token') || h.get('access_token');
        const refresh_token = q.get('refresh_token') || h.get('refresh_token');
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!mounted) return;
          if (!setErr) { router.replace('/dashboard'); return; }
        }

        setMessage('Sign-in failed: unable to establish session');
      } catch (e: any) {
        if (!mounted) return;
        setMessage(`Sign-in failed: ${String(e?.message || e)}`);
      }
    };
    run();
    return () => { mounted = false; };
  }, [router]);

  return (
    <div className="p-6">
      {message}
    </div>
  );
}
