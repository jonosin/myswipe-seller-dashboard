"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getKycStatus, startKyc, stripeDashboardLink, ensureSeller } from "@/lib/api/seller";
import type { KycStatus } from "@/types/seller";
import { toast } from "@/components/toast";

export default function PayoutOnboarding() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<KycStatus>("not_started");
  const verified = status === "verified";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getKycStatus().then((s) => { if (!mounted) return; setStatus(s.status); setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payout onboarding</h2>
        {verified && (
          <span className="inline-flex items-center gap-1 text-sm text-neutral-700"><Check className="h-4 w-4" /> Onboarding complete</span>
        )}
      </div>
      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="h-5 w-32 bg-neutral-100 rounded" />
        ) : verified ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-700">Your payouts are enabled via Stripe.</div>
            <button
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true); setError(null);
                try { const { url } = await stripeDashboardLink(); window.location.assign(url); }
                catch (e: any) { const msg = String(e?.message || e); setError(msg); toast.error("Unable to open Stripe dashboard"); }
                finally { setBusy(false); }
              }}
            >
              Manage on Stripe
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-700">Connect your Stripe account to enable payouts.</div>
            <button
              className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm"
              disabled={busy}
              onClick={async () => {
                setBusy(true); setError(null);
                try {
                  try { await ensureSeller("Seller"); } catch {}
                  const { url } = await startKyc();
                  window.location.assign(url);
                }
                catch (e: any) { const msg = String(e?.message || e); setError(msg); toast.error("Unable to start onboarding. Check backend Stripe config."); }
                finally { setBusy(false); }
              }}
            >
              Start onboarding
            </button>
          </div>
        )}
        {error && (<div className="text-xs text-red-700">{error}</div>)}
      </div>
    </div>
  );
}
