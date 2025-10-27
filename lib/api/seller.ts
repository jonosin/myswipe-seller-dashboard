import type { SellerProfile, SellerStatus } from "@/types/seller";
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

// Stripe onboarding removed in discovery app

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
