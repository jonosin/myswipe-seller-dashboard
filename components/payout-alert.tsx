"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";

export default function PayoutAlert() {
  const { identityVerified, bankLinked, taxProvided } = useAppStore((s) => ({
    identityVerified: s.identityVerified,
    bankLinked: s.bankLinked,
    taxProvided: s.taxProvided,
  }));

  const incomplete = !(identityVerified && bankLinked && taxProvided);
  if (!incomplete) return null;

  return (
    <div className="card p-4 border-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Complete payout onboarding</h3>
          <p className="text-sm text-neutral-700">Verify identity, add bank account, and provide tax info to get paid out.</p>
        </div>
        <Link href="/payouts" className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm">Go to Payouts</Link>
      </div>
    </div>
  );
}
