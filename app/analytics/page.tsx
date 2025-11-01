"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import DataTable from "@/components/data-table";
import { getOverview, getPerProduct, getTimeseries, type WindowParam } from "@/lib/api/analytics";

export default function AnalyticsPage() {
  const [win, setWin] = useState<WindowParam>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ impressions: number; clicks: number; saves: number; ctr: number; save_rate: number } | null>(null);
  const [products, setProducts] = useState<Array<{ id: string; title: string; impressions: number; clicks: number; saves: number; ctr: number; save_rate: number }>>([]);
  const [series, setSeries] = useState<Array<{ dt: string; impressions: number; clicks: number; saves: number }>>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      getOverview(win),
      getPerProduct({ window: win, sort: "clicks", limit: 50 }),
      getTimeseries(win === "7d" ? "7d" : "30d"),
    ])
      .then(([ov, per, ts]) => {
        if (!mounted) return;
        setOverview(ov);
        setProducts(per.items || []);
        setSeries(ts.series || []);
        setLoading(false);
      })
      .catch((e) => { if (!mounted) return; setError(String(e?.message || e)); setLoading(false); });
    return () => { mounted = false; };
  }, [win]);

  const totalImpr = useMemo(() => (overview?.impressions || 0), [overview]);
  const totalClicks = useMemo(() => (overview?.clicks || 0), [overview]);
  const totalSaves = useMemo(() => (overview?.saves || 0), [overview]);
  const ctrPct = useMemo(() => Math.round((overview?.ctr || 0) * 1000) / 10, [overview]);
  const savePct = useMemo(() => Math.round((overview?.save_rate || 0) * 1000) / 10, [overview]);

  return (
    <div>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl">Analytics</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="win" className="sr-only">Window</label>
          <select id="win" value={win} onChange={(e) => setWin(e.target.value as WindowParam)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-4">Loading…</div>
      ) : error ? (
        <div role="alert" className="card p-3 border border-red-300 bg-red-50 text-sm">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="card p-3"><div className="text-sm text-neutral-600">Impressions</div><div className="text-2xl font-semibold">{totalImpr.toLocaleString()}</div></div>
            <div className="card p-3"><div className="text-sm text-neutral-600">Clicks</div><div className="text-2xl font-semibold">{totalClicks.toLocaleString()}</div></div>
            <div className="card p-3"><div className="text-sm text-neutral-600">CTR</div><div className="text-2xl font-semibold">{ctrPct}%</div></div>
            <div className="card p-3"><div className="text-sm text-neutral-600">Saves</div><div className="text-2xl font-semibold">{totalSaves.toLocaleString()}</div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">Top products</h2>
              </div>
              <DataTable
                columns={[
                  { key: "title", header: "Product", render: (r: any) => r.title },
                  { key: "impressions", header: "Impr.", align: "right", render: (r: any) => (r.impressions || 0).toLocaleString() },
                  { key: "clicks", header: "Clicks", align: "right", render: (r: any) => (r.clicks || 0).toLocaleString() },
                  { key: "ctr", header: "CTR", align: "right", render: (r: any) => `${Math.round(((r.ctr || 0) * 1000)) / 10}%` },
                  { key: "saves", header: "Saves", align: "right", render: (r: any) => (r.saves || 0).toLocaleString() },
                  { key: "save_rate", header: "Save rate", align: "right", render: (r: any) => `${Math.round(((r.save_rate || 0) * 1000)) / 10}%` },
                ]}
                rows={products}
                page={1}
                pageSize={products.length}
                total={products.length}
                onPageChange={() => {}}
              />
            </div>
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">Daily metrics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1 pr-2">Date</th>
                      <th className="py-1 pr-2 text-right">Impr.</th>
                      <th className="py-1 pr-2 text-right">Clicks</th>
                      <th className="py-1 pr-2 text-right">Saves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((d) => (
                      <tr key={String(d.dt)} className="border-t border-neutral-100">
                        <td className="py-1 pr-2">{String(d.dt)}</td>
                        <td className="py-1 pr-2 text-right">{(d.impressions || 0).toLocaleString()}</td>
                        <td className="py-1 pr-2 text-right">{(d.clicks || 0).toLocaleString()}</td>
                        <td className="py-1 pr-2 text-right">{(d.saves || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
