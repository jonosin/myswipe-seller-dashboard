"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import DataTable from "@/components/data-table";
import OrderDetailDrawer from "@/components/order-detail-drawer";
import { StatusBadge } from "@/components/status-badge";
import { listOrders, updateOrderStatus } from "@/lib/repo";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { toast } from "@/components/toast";

export default function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const { orderSearch, orderStatus, orderDateFrom, orderDateTo, orderSetFilters } = useAppStore((s) => ({
    orderSearch: s.orderSearch,
    orderStatus: s.orderStatus,
    orderDateFrom: s.orderDateFrom,
    orderDateTo: s.orderDateTo,
    orderSetFilters: s.orderSetFilters,
  }));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listOrders().then((os) => { if (!mounted) return; setRows(os); setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let out = rows.slice();
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      out = out.filter((o) => o.id.toLowerCase().includes(q) || o.buyer.email.toLowerCase().includes(q));
    }
    if (orderStatus !== "all") out = out.filter((o) => o.status === orderStatus);
    if (orderDateFrom) out = out.filter((o) => new Date(o.createdAt) >= new Date(orderDateFrom));
    if (orderDateTo) out = out.filter((o) => new Date(o.createdAt) <= new Date(orderDateTo));
    return out;
  }, [rows, orderSearch, orderStatus, orderDateFrom, orderDateTo]);

  const onOpenOrder = (o: Order) => { setActiveOrder(o); setDrawerOpen(true); };

  const onFulfill = async (id: string) => {
    await updateOrderStatus(id, "fulfilled");
    const os = await listOrders();
    setRows(os);
    toast.success("Order marked as fulfilled");
  };

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Orders</h1>

      <div className="card p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="lg:col-span-2">
          <label className="sr-only" htmlFor="search">Search</label>
          <input id="search" value={orderSearch} onChange={(e) => orderSetFilters({ orderSearch: e.target.value })} placeholder="Search by order ID or email" className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="sr-only" htmlFor="status">Status</label>
          <select id="status" value={orderStatus} onChange={(e) => orderSetFilters({ orderStatus: e.target.value as OrderStatus | "all" })} className="w-full rounded-md border border-neutral-300 px-3 py-2">
            {(["all", "paid", "fulfilled", "in_transit", "refunded"] as const).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="sr-only" htmlFor="from">From</label>
          <input id="from" type="date" value={orderDateFrom || ""} onChange={(e) => orderSetFilters({ orderDateFrom: e.target.value || undefined })} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="sr-only" htmlFor="to">To</label>
          <input id="to" type="date" value={orderDateTo || ""} onChange={(e) => orderSetFilters({ orderDateTo: e.target.value || undefined })} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </div>
      </div>

      {loading ? (
        <div className="card p-4">
          <div className="h-5 w-40 bg-neutral-100 rounded mb-3" />
          <div className="h-5 w-full bg-neutral-100 rounded mb-2" />
          <div className="h-5 w-3/4 bg-neutral-100 rounded" />
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "id", header: "Order ID" },
            { key: "createdAt", header: "Date", render: (o: Order) => formatDate(o.createdAt) },
            { key: "buyer", header: "Buyer", render: (o: Order) => o.buyer.name },
            { key: "status", header: "Status", render: (o: Order) => <StatusBadge status={o.status} /> },
            { key: "total", header: "Total", render: (o: Order) => formatCurrency(o.total), align: "right" },
          ]}
          rows={filtered}
          onRowClick={onOpenOrder}
        />
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-neutral-600 mt-3">No orders found.</div>
      )}

      <OrderDetailDrawer open={drawerOpen} order={activeOrder} onOpenChange={setDrawerOpen} onMarkFulfilled={(id) => onFulfill(id)} />
    </div>
  );
}
