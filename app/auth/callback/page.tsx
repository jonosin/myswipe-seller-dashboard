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
        // Exchange the OAuth code for a session on the client
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href as unknown as string);
        if (!mounted) return;
        if (error) {
          setMessage(`Sign-in failed: ${error.message}`);
          return;
        }
        // Success: route to dashboard
        router.replace("/dashboard");
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
