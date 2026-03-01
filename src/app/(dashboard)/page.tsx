"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { TopProducts } from "@/components/dashboard/top-products";

export default function DashboardPage() {
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

      {/* Stats */}
      <StatsCards />

      {/* Charts + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 stagger">
        <div className="lg:col-span-3 animate-fade-up">
          <SalesChart />
        </div>
        <div className="lg:col-span-2 animate-fade-up">
          <TopProducts />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
        <RecentOrders />
      </div>
    </div>
  );
}
