"use client";

import { supabase } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL as string;
if (!BASE) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export async function apiFetch(path: string, init?: RequestInit & { json?: any }) {
  const url = `${BASE}${path}`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (init?.json !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers as any), ...headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      credentials: "omit",
      mode: "cors",
    } as RequestInit);
  } catch (e: any) {
    throw new Error(`Network error calling ${url}: ${e?.message || e}`);
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
