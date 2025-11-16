"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import DataTable from "@/components/data-table";
import { getOverview, getPerProduct, getTimeseries, type WindowParam } from "@/lib/api/analytics";
import { Eye, MousePointerClick, Activity, Bookmark, Percent } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function AnalyticsPage() {
  const { t } = useT();
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
        <h1 className="text-2xl">{t("analytics.title")}</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="win" className="sr-only">Window</label>
          <select id="win" value={win} onChange={(e) => setWin(e.target.value as WindowParam)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="7d">{t("analytics.last7")}</option>
            <option value="30d">{t("analytics.last30")}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-4">{t("common.loading")}</div>
      ) : error ? (
        <div role="alert" className="card p-3 border border-red-300 bg-red-50 text-sm">{error}</div>
      ) : (
        <>
          <div className="card p-3 mb-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium">{t("analytics.understand")}</summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex items-start gap-3 rounded border border-neutral-200 p-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border"><Eye size={16} /></span>
                  <div>
                    <div className="text-sm font-medium">{t("analytics.metrics.impressions.0")}</div>
                    <div className="text-xs text-neutral-600">{t("analytics.metricsText.impressions")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded border border-neutral-200 p-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border"><MousePointerClick size={16} /></span>
                  <div>
                    <div className="text-sm font-medium">{t("analytics.metrics.clicks.0")}</div>
                    <div className="text-xs text-neutral-600">{t("analytics.metricsText.clicks")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded border border-neutral-200 p-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border"><Activity size={16} /></span>
                  <div>
                    <div className="text-sm font-medium">{t("analytics.metrics.ctr.0")}</div>
                    <div className="text-xs text-neutral-600">{t("analytics.metricsText.ctr")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded border border-neutral-200 p-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border"><Bookmark size={16} /></span>
                  <div>
                    <div className="text-sm font-medium">{t("analytics.metrics.saves.0")}</div>
                    <div className="text-xs text-neutral-600">{t("analytics.metricsText.saves")}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded border border-neutral-200 p-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 border"><Percent size={16} /></span>
                  <div>
                    <div className="text-sm font-medium">{t("analytics.metrics.saveRate.0")}</div>
                    <div className="text-xs text-neutral-600">{t("analytics.metricsText.saveRate")}</div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="card p-3"><div className="text-sm text-neutral-600">{t("analytics.metrics.impressions.0")}</div><div className="text-2xl font-semibold">{totalImpr.toLocaleString()}</div></div>
            <div className="card p-3"><div className="text-sm text-neutral-600">{t("analytics.metrics.clicks.0")}</div><div className="text-2xl font-semibold">{totalClicks.toLocaleString()}</div></div>
            <div className="card p-3"><div className="text-sm text-neutral-600">{t("analytics.metrics.ctr.0")}</div><div className="text-2xl font-semibold">{ctrPct}%</div></div>
            <div className="card p-3"><div className="text-sm text-neutral-600">{t("analytics.metrics.saves.0")}</div><div className="text-2xl font-semibold">{totalSaves.toLocaleString()}</div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">{t("analytics.topProducts")}</h2>
              </div>
              <details className="mb-2">
                <summary className="cursor-pointer text-sm font-medium">{t("analytics.whatIs")}</summary>
                <p className="mt-1 text-sm">{t("analytics.topDesc")}</p>
              </details>
              <DataTable
                columns={[
                  { key: "title", header: t("products.columns.product"), render: (r: any) => r.title },
                  { key: "impressions", header: t("analytics.imprShort"), align: "right", render: (r: any) => (r.impressions || 0).toLocaleString() },
                  { key: "clicks", header: t("analytics.clicks"), align: "right", render: (r: any) => (r.clicks || 0).toLocaleString() },
                  { key: "ctr", header: t("analytics.ctr"), align: "right", render: (r: any) => `${Math.round(((r.ctr || 0) * 1000)) / 10}%` },
                  { key: "saves", header: t("analytics.saves"), align: "right", render: (r: any) => (r.saves || 0).toLocaleString() },
                  { key: "save_rate", header: t("analytics.saveRate"), align: "right", render: (r: any) => `${Math.round(((r.save_rate || 0) * 1000)) / 10}%` },
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
                <h2 className="text-lg font-medium">{t("analytics.daily")}</h2>
              </div>
              <details className="mb-2">
                <summary className="cursor-pointer text-sm font-medium">{t("analytics.whatIs")}</summary>
                <p className="mt-1 text-sm">{t("analytics.dailyDesc")}</p>
              </details>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1 pr-2">{t("analytics.date")}</th>
                      <th className="py-1 pr-2 text-right">{t("analytics.imprShort")}</th>
                      <th className="py-1 pr-2 text-right">{t("analytics.clicks")}</th>
                      <th className="py-1 pr-2 text-right">{t("analytics.saves")}</th>
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
