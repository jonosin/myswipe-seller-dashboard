"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import PayoutOnboarding from "@/components/payout-onboarding";
import { getPayoutSummary } from "@/lib/api/payouts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PayoutData } from "@/lib/types";

export default function PayoutsPage() {
  const [payout, setPayout] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | "paid" | "pending" | "failed">("all");

  useEffect(() => {
    let mounted = true;
    getPayoutSummary()
      .then((p) => { if (!mounted) return; setPayout(p); setLoading(false); })
      .catch((e) => { if (!mounted) return; setError(String(e?.message || e)); setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const history = useMemo(() => {
    if (!payout) return [];
    if (status === "all") return payout.history;
    return payout.history.filter((h) => h.status === status);
  }, [payout, status]);

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Payouts</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          {loading ? (
            <>
              <div className="h-4 w-20 bg-neutral-100 rounded" />
              <div className="h-8 w-32 bg-neutral-100 rounded mt-2" />
              <div className="h-4 w-40 bg-neutral-100 rounded mt-2" />
              <div className="h-4 w-48 bg-neutral-100 rounded mt-1" />
            </>
          ) : error ? (
            <>
              <div className="text-sm text-red-700">{error}</div>
              <div className="text-xs text-neutral-600 mt-1">If Stripe is not configured on the backend, this summary may be unavailable.</div>
            </>
          ) : payout ? (
            <>
              <div className="text-sm text-neutral-600">Balance</div>
              <div className="text-2xl font-semibold mt-1">{formatCurrency(payout.currentBalance)}</div>
              <div className="text-sm text-neutral-600 mt-2">Schedule: {payout.schedule}</div>
              <div className="text-sm text-neutral-600">Next Payout: {formatDate(payout.nextPayoutDate)}</div>
            </>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <PayoutOnboarding />
        </div>
      </div>

      <section aria-labelledby="payout-history">
        <div className="flex items-center justify-between mb-2">
          <h2 id="payout-history" className="text-lg font-semibold">Payout History</h2>
          <div>
            <label className="sr-only" htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as any)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
              {(["all", "paid", "pending", "failed"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading || !payout ? (
                <tr><td colSpan={4}>
                  <div className="h-5 w-full bg-neutral-100 rounded" />
                </td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={4} className="text-sm text-neutral-600">No payouts</td></tr>
              ) : (
                history.map((h: PayoutData["history"][number]) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{formatDate(h.date)}</td>
                    <td className="text-right">{formatCurrency(h.amount)}</td>
                    <td>{h.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
