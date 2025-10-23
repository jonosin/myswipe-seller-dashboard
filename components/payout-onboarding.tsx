"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { getKycStatus, startKyc, stripeDashboardLink, ensureSeller, getSellerProfile } from "@/lib/api/seller";
import type { KycStatus } from "@/types/seller";
import { toast } from "@/components/toast";

export default function PayoutOnboarding() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<KycStatus>("not_started");
  const [connected, setConnected] = useState<boolean>(false);
  const verified = status === "verified";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // ensure seller exists, then load initial status and profile
    (async () => {
      try { await ensureSeller("Seller"); } catch {}
      const res = await Promise.allSettled([getKycStatus(), getSellerProfile()]);
      if (!mounted) return;
      const s0 = res[0].status === "fulfilled" ? res[0].value.status : "not_started";
      const p0 = res[1].status === "fulfilled" ? res[1].value : null;
      setStatus(s0 as KycStatus);
      setConnected(!!p0?.stripe_account_id);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Light polling while in-progress to update UI after redirect
  useEffect(() => {
    if (!connected || verified) return;
    let timer: any;
    let count = 0;
    const tick = async () => {
      try {
        const s = await getKycStatus();
        setStatus(s.status);
        if (s.status === "verified") return;
      } catch {}
      if (++count < 6) timer = setTimeout(tick, 5000); // poll up to ~30s
    };
    timer = setTimeout(tick, 3000);
    return () => { if (timer) clearTimeout(timer); };
  }, [connected, verified]);

  // Poll seller profile briefly until connected
  useEffect(() => {
    if (connected) return;
    let timer: any;
    let tries = 0;
    const loop = async () => {
      try {
        const p = await getSellerProfile();
        if (p?.stripe_account_id) { setConnected(true); return; }
      } catch {}
      if (++tries < 6) timer = setTimeout(loop, 3000);
    };
    timer = setTimeout(loop, 2000);
    return () => { if (timer) clearTimeout(timer); };
  }, [connected]);

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
                try {
                  const { url } = await stripeDashboardLink();
                  window.location.assign(url);
                } catch (e: any) {
                  // Fallback for Standard accounts (login link unsupported)
                  window.location.assign('https://dashboard.stripe.com/test/');
                } finally { setBusy(false); }
              }}
            >
              Manage on Stripe
            </button>
          </div>
        ) : connected ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-700">Stripe account connected. Verification in progress.</div>
            <button
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              disabled={busy}
              onClick={() => { window.location.assign('https://dashboard.stripe.com/test/'); }}
            >
              Open Stripe
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
