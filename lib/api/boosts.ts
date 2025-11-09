import { apiFetch } from "@/lib/api/client";

export type Boost = {
  id: string;
  product_id: string;
  seller_id: string;
  start_at: string;
  end_at: string;
  status: string;
  package_code: string;
  price_minor: number;
  currency: string;
  created_at: string;
};

export async function listBoosts(): Promise<{ items: Boost[] }> {
  const res = await apiFetch(`/v1/boosts`);
  return { items: (res.items || []) as Boost[] };
}

export async function createBoosts(productIds: string[]): Promise<{ ok: boolean; created: Array<{ id: string | null; product_id: string; status: string }> }> {
  const res = await apiFetch(`/v1/boosts`, { method: "POST", json: { product_ids: productIds } });
  return res as any;
}

export async function cancelBoost(id: string): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/v1/boosts/${id}/cancel`, { method: "POST" });
  return res as any;
}

export async function createBoostCheckout(productIds: string[], days?: number): Promise<{ ok: boolean; url: string }> {
  const res = await apiFetch(`/v1/boosts/checkout`, { method: "POST", json: { product_ids: productIds, days } });
  return res as any;
}
