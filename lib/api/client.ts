"use client";

import { supabase } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
if (!BASE) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}
const ADMIN_SECRET = (process.env.NEXT_PUBLIC_ADMIN_SECRET || (process.env as any).ADMIN_SECRET) as string | undefined;

export async function apiFetch(path: string, init?: RequestInit & { json?: any }) {
  const url = `${BASE}${path}`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init?.json !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (ADMIN_SECRET) headers["X-Admin-Secret"] = ADMIN_SECRET;

  const DEFAULT_TIMEOUT_MS = Number((process.env as any).NEXT_PUBLIC_API_TIMEOUT_MS || 60000);
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(new Error("timeout")), Math.max(1000, DEFAULT_TIMEOUT_MS));
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers as any), ...headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      credentials: "omit",
      mode: "cors",
      signal: ac.signal,
    } as RequestInit);
  } catch (e: any) {
    clearTimeout(to);
    const msg = e?.name === 'AbortError' ? `Request timeout calling ${url}` : `Network error calling ${url}: ${e?.message || e}`;
    throw new Error(msg);
  } finally {
    clearTimeout(to);
  }
  if (!res.ok) {
    let msg = `${res.status}`;
    try { const t = await res.text(); msg = t || msg; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
