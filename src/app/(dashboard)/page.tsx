import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { TopProducts } from "@/components/dashboard/top-products";
import { PaymentBreakdown } from "@/components/dashboard/payment-breakdown";
import { LowStockWarning } from "@/components/dashboard/low-stock-warning";
import { HourlySales } from "@/components/dashboard/hourly-sales";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { CategoryPerformance } from "@/components/dashboard/category-performance";
import { getDashboardStats, getBestSellers } from "@/lib/actions/reports";
import { getOrders } from "@/lib/actions/orders";
import { processRecurringExpenses } from "@/lib/actions/expense-tracker";

export default async function DashboardPage() {
  // Process any due recurring expenses on dashboard load
  processRecurringExpenses().catch(() => { });

  const [stats, topProductsData, recentOrdersData] = await Promise.all([
    getDashboardStats(),
    getBestSellers(5),
    getOrders({ limit: 5 }),
  ]);

  // Format best sellers into the shape expected by TopProducts
  const maxQty = topProductsData.length > 0 ? topProductsData[0].totalQty : 1;
  const mappedTopProducts = topProductsData.map((p) => ({
    name: p.productName,
    sold: p.totalQty,
    percentage: Math.round((p.totalQty / maxQty) * 100),
  }));

  // Format recent orders into the shape expected by RecentOrders
  const mappedRecentOrders = recentOrdersData.data.map((order) => {
    const createdDate = new Date(order.createdAt);
    const timeString = createdDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      id: order.id,
      customer: (order as any).customerName || "Pelanggan Umum",
      total: order.total,
      status: order.status,
      time: timeString,
    };
  });

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
          Dashboard
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ringkasan penjualan dan aktivitas toko Anda
        </p>
      </div>



      {/* Stats — 6 cards in 3-column grid */}
      <StatsCards stats={stats} />

      {/* Low Stock Warning */}
      {stats.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="animate-fade-up">
          <LowStockWarning items={stats.lowStockItems} />
        </div>
      )}

      {/* Row 1: Weekly Sales Chart + Hourly Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 stagger">
        <div className="lg:col-span-3 animate-fade-up">
          <SalesChart data={stats.weekData} />
        </div>
        <div className="lg:col-span-2 animate-fade-up">
          <HourlySales data={stats.hourlySales} />
        </div>
      </div>

      {/* Row 2: Monthly Trend + Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 stagger">
        <div className="lg:col-span-3 animate-fade-up">
          <MonthlyTrend data={stats.monthlySales} />
        </div>
        <div className="lg:col-span-2 animate-fade-up">
          <CategoryPerformance data={stats.categorySales} />
        </div>
      </div>

      {/* Row 3: Top Products + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 stagger">
        <div className="lg:col-span-2 animate-fade-up">
          <TopProducts products={mappedTopProducts} />
        </div>
        <div className="lg:col-span-3 animate-fade-up">
          <RecentOrders orders={mappedRecentOrders} />
        </div>
      </div>

      {/* Row 4: Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 stagger">
        <div className="lg:col-span-2 animate-fade-up">
          <PaymentBreakdown data={stats.paymentBreakdown || {}} />
        </div>
      </div>
    </div>
  );
}
