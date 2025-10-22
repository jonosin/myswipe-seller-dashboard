"use client";

import { useAppStore } from "@/lib/store";
import { Check } from "lucide-react";

export default function PayoutOnboarding() {
  const { identityVerified, bankLinked, taxProvided, setStep } = useAppStore((s) => ({
    identityVerified: s.identityVerified,
    bankLinked: s.bankLinked,
    taxProvided: s.taxProvided,
    setStep: s.setStep,
  }));

  const allDone = identityVerified && bankLinked && taxProvided;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payout onboarding</h2>
        {allDone && (
          <span className="inline-flex items-center gap-1 text-sm text-neutral-700"><Check className="h-4 w-4" /> Onboarding complete</span>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        <li className="flex items-center justify-between">
          <span>Verify identity</span>
          <input type="checkbox" checked={identityVerified} onChange={(e) => setStep("identityVerified", e.target.checked)} aria-label="Verify identity" />
        </li>
        <li className="flex items-center justify-between">
          <span>Add bank account</span>
          <input type="checkbox" checked={bankLinked} onChange={(e) => setStep("bankLinked", e.target.checked)} aria-label="Add bank account" />
        </li>
        <li className="flex items-center justify-between">
          <span>Provide tax info</span>
          <input type="checkbox" checked={taxProvided} onChange={(e) => setStep("taxProvided", e.target.checked)} aria-label="Provide tax info" />
        </li>
      </ul>
    </div>
  );
}
