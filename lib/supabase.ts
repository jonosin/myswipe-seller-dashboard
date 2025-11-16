"use client";
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

let client: any;
if (BYPASS) {
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: { message: "Disabled in dev bypass" } }),
      signInWithOAuth: async () => ({ data: { url: null }, error: { message: "Disabled in dev bypass" } }),
      setSession: async () => ({ data: null, error: { message: "Disabled in dev bypass" } }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: (_bucket: string) => ({
        uploadToSignedUrl: async () => ({ error: { message: "Disabled in dev bypass" } }),
      }),
    },
  } as any;
} else {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = client as any;
