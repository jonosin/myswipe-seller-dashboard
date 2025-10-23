"use client";

import { apiFetch } from "@/lib/api/client";
import type { PayoutData } from "@/lib/types";

export async function getPayoutSummary(): Promise<PayoutData> {
  const res = await apiFetch(`/v1/seller/payouts/summary`);
  const currency = (res.currency as string) || "THB";
  const available_minor = Number(res.available_minor || 0);
  const interval = (res.interval as string) || "weekly";
  const schedule: PayoutData["schedule"] = interval === "daily" ? "daily" : interval === "monthly" ? "monthly" : "weekly";
  const next = (() => {
    const now = new Date();
    if (schedule === "daily") return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    if (schedule === "monthly") return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  })();
  return {
    currentBalance: Math.max(0, Math.round(available_minor) / 100),
    nextPayoutDate: next,
    schedule,
    history: [],
  };
}
