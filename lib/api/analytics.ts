import { apiFetch } from "@/lib/api/client";

export type WindowParam = "7d" | "30d";

export async function getOverview(window: WindowParam = "7d") {
  return apiFetch(`/v1/seller/analytics/overview?window=${encodeURIComponent(window)}`);
}

export async function getPerProduct(params: { window?: WindowParam; sort?: "impressions"|"clicks"|"saves"; limit?: number } = {}) {
  const w = params.window || "7d";
  const s = params.sort || "clicks";
  const l = typeof params.limit === "number" ? Math.max(1, Math.min(100, params.limit)) : 50;
  const qs = new URLSearchParams({ window: String(w), sort: String(s), limit: String(l) });
  return apiFetch(`/v1/seller/analytics/products?${qs.toString()}`);
}

export async function getTimeseries(window: WindowParam = "30d") {
  return apiFetch(`/v1/seller/analytics/timeseries?window=${encodeURIComponent(window)}`);
}
