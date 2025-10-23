"use client";

import { useEffect, useState } from "react";
import { getKycStatus, startKyc } from "@/lib/api/seller";

export default function PayoutAlert() {
  const [loading, setLoading] = useState(true);
  const [incomplete, setIncomplete] = useState(false);
  useEffect(() => {
    let mounted = true;
    getKycStatus().then((s) => { if (!mounted) return; setIncomplete(s.status !== "verified"); setLoading(false); });
    return () => { mounted = false; };
  }, []);
  if (loading || !incomplete) return null;

  return (
    <div className="card p-4 border-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Complete payout onboarding</h3>
          <p className="text-sm text-neutral-700">Verify identity, add bank account, and provide tax info to get paid out.</p>
        </div>
        <button
          onClick={async () => { const { url } = await startKyc(); window.location.href = url; }}
          className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm"
        >
          Start onboarding
        </button>
      </div>
    </div>
  );
}
