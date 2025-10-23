import type { KycStatus, SellerProfile, SellerStatus } from "@/types/seller";
import { apiFetch } from "@/lib/api/client";

export async function getSellerProfile(): Promise<SellerProfile> {
  const row = await apiFetch(`/v1/sellers/me`);
  return {
    display_name: row.display_name,
    logo_url: row.logo_url || undefined,
    seller_status: (row.status as SellerStatus) || "pending",
    stripe_account_id: row.stripe_account_id || null,
  };
}

export async function updateSellerProfile(input: Partial<SellerProfile>): Promise<SellerProfile> {
  const payload: any = {};
  if (typeof input.display_name === "string") payload.display_name = input.display_name;
  if (typeof input.logo_url === "string") payload.logo_url = input.logo_url;
  const row = await apiFetch(`/v1/sellers/me`, { method: "PATCH", json: payload });
  return {
    display_name: row.display_name,
    logo_url: row.logo_url || undefined,
    seller_status: (row.status as SellerStatus) || "pending",
    stripe_account_id: row.stripe_account_id || null,
  };
}

export async function getSellerStatus(): Promise<{ status: SellerStatus }>{
  try {
    const row = await apiFetch(`/v1/sellers/me`);
    return { status: (row.status as SellerStatus) || "pending" };
  } catch {
    return { status: "pending" };
  }
}

export async function getKycStatus(): Promise<{ status: KycStatus }>{
  try {
    const row = await apiFetch(`/v1/sellers/onboard/status`);
    const ok = !!row.charges_enabled && !!row.payouts_enabled;
    return { status: ok ? "verified" : "in_progress" };
  } catch {
    // Fallback: if seller has a connected account, treat as in_progress (Standard accounts)
    try {
      const prof = await apiFetch(`/v1/sellers/me`);
      if (prof?.stripe_account_id) return { status: "in_progress" };
    } catch {}
    return { status: "not_started" };
  }
}

export async function startKyc(): Promise<{ started: true; url: string }>{
  const origin = typeof window !== "undefined" ? window.location.origin : undefined;
  const json: any = {};
  if (origin) {
    json.return_url = `${origin}/payouts`;
    json.refresh_url = `${origin}/payouts`;
  }
  try {
    const res = await apiFetch(`/v1/sellers/onboard/start`, { method: "POST", json });
    return { started: true, url: res.url as string };
  } catch (e: any) {
    const msg = String(e?.message || e || "").toLowerCase();
    if (msg.includes("not_found") || msg.includes("404")) {
      // Ensure seller exists then retry once
      try { await ensureSeller("Seller"); } catch {}
      const res2 = await apiFetch(`/v1/sellers/onboard/start`, { method: "POST", json });
      return { started: true, url: res2.url as string };
    }
    throw e;
  }
}

export async function stripeDashboardLink(): Promise<{ url: string }>{
  const res = await apiFetch(`/v1/sellers/dashboard-link`, { method: "POST", json: {} });
  return { url: res.url as string };
}

export async function ensureSeller(display_name?: string, logo_url?: string): Promise<void> {
  try {
    await apiFetch(`/v1/sellers`, { method: "POST", json: { display_name: display_name || "Seller", logo_url } });
  } catch (e: any) {
    const msg = String(e?.message || e || "").toLowerCase();
    // Treat conflict (already exists) as success
    if (msg.includes("conflict") || msg.includes("409")) return;
    throw e;
  }
}
