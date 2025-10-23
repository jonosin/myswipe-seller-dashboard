import Breadcrumbs from "@/components/breadcrumbs";
import KpiCard from "@/components/kpi-card";
import PayoutAlert from "@/components/payout-alert";
import RecentOrdersTable from "@/components/recent-orders-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDashboardMetrics } from "@/lib/repo";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Sales" value={formatCurrency(metrics.totalSales)} />
        <KpiCard title="Pending Payouts" value={formatCurrency(metrics.pendingPayouts)} />
        <KpiCard title="Active Listings" value={String(metrics.activeListings)} />
        <KpiCard title="Orders in Transit" value={String(metrics.inTransit)} />
      </div>

      <div className="mb-6">
        <PayoutAlert />
      </div>

      <section aria-labelledby="recent-orders">
        <h2 id="recent-orders" className="text-lg font-semibold mb-2">Recent Orders</h2>
        <RecentOrdersTable rows={metrics.recentOrders as any} />
      </section>
    </div>
  );
}
