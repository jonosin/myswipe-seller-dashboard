"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import ConfirmDialog from "@/components/confirm-dialog";
import { listBoosts, createBoosts, cancelBoost, createBoostCheckout, activateBoostsFromSession, type Boost } from "@/lib/api/boosts";
import { listProducts } from "@/lib/api/products";
import type { ProductSummary } from "@/types/product";
import { formatTHBCompact } from "@/lib/utils";
import { toast } from "@/components/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function BoostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const activeProductIds = useMemo(() => new Set(boosts.filter(b => b.status === "active").map(b => b.product_id)), [boosts]);
  const liveBoosts = useMemo(() => boosts.filter(b => b.status === "active"), [boosts]);
  const expiredBoosts = useMemo(() => boosts.filter(b => b.status !== "active"), [boosts]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prod, bl] = await Promise.all([
        listProducts({ page: 1, page_size: 100 }),
        listBoosts(),
      ]);
      setProducts(prod.items);
      setBoosts((bl.items || []).sort((a, b) => (b.start_at || "").localeCompare(a.start_at || "")));
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // After Stripe redirect, activate boosts from session_id if present
  useEffect(() => {
    const ch = searchParams?.get("checkout");
    const sid = searchParams?.get("session_id");
    if (ch === "success" && sid && !activating) {
      setActivating(true);
      let attempts = 0;
      const tryActivate = async () => {
        attempts++;
        try {
          const res = await activateBoostsFromSession(sid);
          const ok = (res.created || []).filter(x => x.status === "active").length;
          if (ok > 0) {
            toast.success(t("boosts.toasts.activated", { count: ok }));
            await loadAll();
            setActivating(false);
            // Clean the URL
            if (typeof window !== 'undefined') window.history.replaceState({}, "", "/boosts");
            return;
          }
          // No active created: may have been already active elsewhere
          toast.info(t("boosts.toasts.noActivated"));
          await loadAll();
          setActivating(false);
          if (typeof window !== 'undefined') window.history.replaceState({}, "", "/boosts");
        } catch (e: any) {
          // For async methods, payment may not be confirmed yet; retry for up to ~2 minutes
          if (attempts === 1) toast.info(t("boosts.toasts.waitingPayment"));
          if (attempts < 24) {
            setTimeout(tryActivate, 5000);
          } else {
            setActivating(false);
            // Fallback: if webhook activated in background, refresh list so UI updates
            try { await loadAll(); } catch {}
            toast.error(String(e?.message || e));
            if (typeof window !== 'undefined') window.history.replaceState({}, "", "/boosts");
          }
        }
      };
      tryActivate();
    }
  }, [searchParams, activating, t]);

  // Also poll the boosts list briefly after checkout success to reflect webhook activation even if manual activation fails
  useEffect(() => {
    const ch = searchParams?.get("checkout");
    if (ch === "success") {
      let ticks = 0;
      const id = setInterval(async () => {
        ticks++;
        try { await loadAll(); } catch {}
        if (ticks >= 24) {
          clearInterval(id);
        }
      }, 5000);
      return () => clearInterval(id);
    }
  }, [searchParams]);

  const selectable = useMemo(() => products.filter(p => p.active && (p.mode ?? "discover") !== "deal"), [products]);

  const onToggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const onCreate = async () => {
    const ids = Array.from(selected).filter(id => !activeProductIds.has(id));
    if (!ids.length) { toast.info(t("boosts.toasts.selectOne")); return; }
    try {
      const res = await createBoostCheckout(ids);
      if ((res as any)?.url) {
        window.location.assign((res as any).url);
        return;
      }
      toast.error(t("boosts.toasts.checkoutMissing"));
    } catch (e: any) {
      toast.error(String(e?.message || e));
    }
  };

  const onCancel = async (id: string) => {
    try {
      await cancelBoost(id);
      toast.success(t("boosts.toasts.cancelled"));
      await loadAll();
    } catch (e: any) {
      toast.error(String(e?.message || e));
    }
  };

  return (
    <div>
      <Breadcrumbs />
      <div className="mb-4">
        <h1 className="text-2xl">{t("boosts.title")}</h1>
      </div>

      <div className="card p-4 mb-4 space-y-2">
        <div className="text-base font-medium">{t("boosts.whatIs")}</div>
        <p className="text-sm">{t("boosts.whatIsLine1")}</p>
        <p className="text-sm">{t("boosts.whatIsLine2", { price: formatTHBCompact(199900) })}</p>
      </div>

      <div className="card p-3 mb-4 text-sm">
        <div className="font-medium mb-1">{t("boosts.promote")}</div>
        <div className="mb-3">{t("boosts.perProduct", { price: formatTHBCompact(199900) })}</div>
        <div className="flex flex-col gap-2">
          <div className="max-h-56 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2 w-10"></th>
                  <th className="text-left px-3 py-2">{t("boosts.product")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.price")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.status")}</th>
                </tr>
              </thead>
              <tbody>
                {selectable.map(p => {
                  const disabled = activeProductIds.has(p.id);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">
                        <input aria-label="Select product" type="checkbox" disabled={disabled} checked={selected.has(p.id)} onChange={(e) => onToggle(p.id, e.currentTarget.checked)} />
                      </td>
                      <td className="px-3 py-2">{p.title}</td>
                      <td className="px-3 py-2">{formatTHBCompact(p.price_minor)}</td>
                      <td className="px-3 py-2">{disabled ? t("boosts.boosting") : (p.active ? t("status.active") : t("status.draft"))}</td>
                    </tr>
                  );
                })}
                {selectable.length === 0 && (
                  <tr><td className="px-3 py-3" colSpan={4}>{t("boosts.noEligible")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <button onClick={onCreate} disabled={selected.size === 0} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm disabled:opacity-50">{t("boosts.checkout")}</button>
          </div>
        </div>
      </div>

      <div className="card p-3 mb-4">
        <div className="font-medium mb-2">{t("boosts.live")}</div>
        {loading ? (
          <div className="text-sm">{t("boosts.loading")}</div>
        ) : liveBoosts.length === 0 ? (
          <div className="text-sm">{t("boosts.noLive")}</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2">{t("boosts.product")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.start")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.end")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.status")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.price")}</th>
                  <th className="text-right px-3 py-2">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {liveBoosts.map(b => {
                  const p = productMap.get(b.product_id);
                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-3 py-2">{p?.title || b.product_id}</td>
                      <td className="px-3 py-2">{new Date(b.start_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{new Date(b.end_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{b.status}</td>
                      <td className="px-3 py-2">{formatTHBCompact(b.price_minor)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => setConfirmId(b.id)} className="rounded-md border px-2 py-1 text-xs">{t("boosts.cancel")}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-3">
        <div className="font-medium mb-2">{t("boosts.previous")}</div>
        {loading ? (
          <div className="text-sm">{t("boosts.loading")}</div>
        ) : expiredBoosts.length === 0 ? (
          <div className="text-sm">{t("boosts.noPrev")}</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2">{t("boosts.product")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.start")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.end")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.status")}</th>
                  <th className="text-left px-3 py-2">{t("boosts.price")}</th>
                </tr>
              </thead>
              <tbody>
                {expiredBoosts.map(b => {
                  const p = productMap.get(b.product_id);
                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-3 py-2">{p?.title || b.product_id}</td>
                      <td className="px-3 py-2">{new Date(b.start_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{new Date(b.end_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{b.status}</td>
                      <td className="px-3 py-2">{formatTHBCompact(b.price_minor)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => { if (!o) setConfirmId(null); }}
        title={t("boosts.cancelConfirm.title")}
        description={t("boosts.cancelConfirm.desc")}
        onConfirm={async () => { if (confirmId) { await onCancel(confirmId); setConfirmId(null); } }}
      />
    </div>
  );
}
