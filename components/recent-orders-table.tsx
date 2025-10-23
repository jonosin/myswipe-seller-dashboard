"use client";

import DataTable from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RecentOrdersTable({ rows }: { rows: Order[] }) {
  return (
    <DataTable
      columns={[
        { key: "id", header: "Order ID" },
        { key: "createdAt", header: "Date", render: (o: Order) => formatDate(o.createdAt) },
        { key: "buyer", header: "Buyer", render: (o: Order) => o.buyer.name },
        { key: "status", header: "Status", render: (o: Order) => <StatusBadge status={o.status} /> },
        { key: "total", header: "Total", render: (o: Order) => formatCurrency(o.total), align: "right" },
      ]}
      rows={rows}
    />
  );
}
