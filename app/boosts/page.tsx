"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import ConfirmDialog from "@/components/confirm-dialog";
import { listBoosts, createBoosts, cancelBoost, type Boost } from "@/lib/api/boosts";
import { listProducts } from "@/lib/api/products";
import type { ProductSummary } from "@/types/product";
import { formatTHBCompact } from "@/lib/utils";
import { toast } from "@/components/toast";

export default function BoostsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const activeProductIds = useMemo(() => new Set(boosts.filter(b => b.status === "active").map(b => b.product_id)), [boosts]);

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

  const selectable = useMemo(() => products.filter(p => p.active && (p.mode ?? "discover") !== "deal"), [products]);

  const onToggle = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const onCreate = async () => {
    const ids = Array.from(selected).filter(id => !activeProductIds.has(id));
    if (!ids.length) { toast.info("Select at least 1 eligible product"); return; }
    try {
      const res = await createBoosts(ids);
      const ok = (res.created || []).filter(x => x.id).length;
      if (ok > 0) toast.success(`Started ${ok} boost${ok !== 1 ? "s" : ""}`);
      if (ok < ids.length) toast.info("Some boosts could not be created");
      setSelected(new Set());
      await loadAll();
    } catch (e: any) {
      toast.error(String(e?.message || e));
    }
  };

  const onCancel = async (id: string) => {
    try {
      await cancelBoost(id);
      toast.success("Boost cancelled");
      await loadAll();
    } catch (e: any) {
      toast.error(String(e?.message || e));
    }
  };

  return (
    <div>
      <Breadcrumbs />
      <div className="mb-4">
        <h1 className="text-2xl">Boosts</h1>
      </div>

      <div className="card p-3 mb-4 text-sm">
        <div className="font-medium mb-1">Promote a product</div>
        <div className="mb-3">3 days • {formatTHBCompact(199900)} per product</div>
        <div className="flex flex-col gap-2">
          <div className="max-h-56 overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2 w-10"></th>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-left px-3 py-2">Price</th>
                  <th className="text-left px-3 py-2">Status</th>
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
                      <td className="px-3 py-2">{disabled ? "Boosting" : (p.active ? "Active" : "Draft")}</td>
                    </tr>
                  );
                })}
                {selectable.length === 0 && (
                  <tr><td className="px-3 py-3" colSpan={4}>No eligible products</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <button onClick={onCreate} disabled={selected.size === 0} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm disabled:opacity-50">Start Boost Now</button>
          </div>
        </div>
      </div>

      <div className="card p-3">
        <div className="font-medium mb-2">Your boosts</div>
        {loading ? (
          <div className="text-sm">Loading...</div>
        ) : boosts.length === 0 ? (
          <div className="text-sm">No boosts yet.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-left px-3 py-2">Start</th>
                  <th className="text-left px-3 py-2">End</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Price</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {boosts.map(b => {
                  const p = productMap.get(b.product_id);
                  const canCancel = b.status === "active";
                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-3 py-2">{p?.title || b.product_id}</td>
                      <td className="px-3 py-2">{new Date(b.start_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{new Date(b.end_at).toLocaleString()}</td>
                      <td className="px-3 py-2">{b.status}</td>
                      <td className="px-3 py-2">{formatTHBCompact(b.price_minor)}</td>
                      <td className="px-3 py-2 text-right">
                        <button disabled={!canCancel} onClick={() => setConfirmId(b.id)} className="rounded-md border px-2 py-1 text-xs disabled:opacity-50">Cancel</button>
                      </td>
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
        title="Cancel boost"
        description="This will stop the boost immediately."
        onConfirm={async () => { if (confirmId) { await onCancel(confirmId); setConfirmId(null); } }}
      />
    </div>
  );
}
