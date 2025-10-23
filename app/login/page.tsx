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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/dashboard");
  };


  const onGoogle = async () => {
    setLoading(true); setError(null);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
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
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={loading} className="w-full rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2">{loading ? "Signing in…" : "Sign in"}</button>
          <button type="button" disabled={loading} onClick={onGoogle} className="w-full rounded-md border border-neutral-300 px-4 py-2 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.491 31.763 29.158 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.641 5.1 29.609 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.26 16.048 18.75 13 24 13c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.641 5.1 29.609 3 24 3 15.3 3 8.079 8.234 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 43c5.095 0 9.727-1.958 13.228-5.144l-6.104-4.992C29.1 34.83 26.705 35 24 35c-5.122 0-9.432-3.287-10.959-7.85L6.398 32.4C9.12 38.89 15.935 43 24 43z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.27 3.651-4.299 6.283-8.197 7.201l6.104 4.992C38.26 37.121 44 31.654 44 23c0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </form>
      <div className="text-xs text-neutral-600">Using this dashboard will create a seller account for you after login.</div>
    </div>
  );
}
