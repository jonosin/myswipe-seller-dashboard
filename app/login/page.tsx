"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/dashboard");
  };

  const onMagic = async () => {
    setLoading(true); setError(null); setNotice(null);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setNotice("Check your email for the magic link.");
  };

  const onGoogle = async () => {
    setLoading(true); setError(null);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data?.url) { window.location.assign(data.url); return; }
    setError("Unable to start Google sign-in");
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 border border-neutral-200 rounded-lg space-y-4">
      <h1 className="text-xl font-semibold">Welcome</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm mb-1">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm mb-1">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {notice && <div className="text-sm text-green-700">{notice}</div>}
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={loading} className="w-full rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2">{loading ? "Signing in…" : "Sign in"}</button>
          <button type="button" disabled={loading || !email} onClick={onMagic} className="w-full rounded-md border border-neutral-300 px-4 py-2">Send magic link</button>
          <button type="button" disabled={loading} onClick={onGoogle} className="w-full rounded-md border border-neutral-300 px-4 py-2">Continue with Google</button>
        </div>
      </form>
      <div className="text-xs text-neutral-600">Using this dashboard will create a seller account for you after login.</div>
    </div>
  );
}
