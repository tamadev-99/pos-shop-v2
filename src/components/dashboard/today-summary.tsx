"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { ShoppingBag, ClipboardList, UserPlus, Truck } from "lucide-react";

interface TodaySummaryProps {
  data: {
    totalSales: number;
    totalOrders: number;
    newCustomers: number;
    pendingPurchaseOrders: number;
  };
}

export function TodaySummary({ data }: TodaySummaryProps) {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const metrics = [
    {
      label: "Penjualan",
      value: formatRupiah(data.totalSales),
      icon: ShoppingBag,
      iconColor: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-teal-500/20",
    },
    {
      label: "Pesanan",
      value: formatNumber(data.totalOrders),
      icon: ClipboardList,
      iconColor: "text-cyan-400",
      bgColor: "from-cyan-500/20 to-blue-500/20",
    },
    {
      label: "Pelanggan Baru",
      value: formatNumber(data.newCustomers),
      icon: UserPlus,
      iconColor: "text-violet-400",
      bgColor: "from-violet-500/20 to-purple-500/20",
    },
    {
      label: "PO Pending",
      value: formatNumber(data.pendingPurchaseOrders),
      icon: Truck,
      iconColor: "text-amber-400",
      bgColor: "from-amber-500/20 to-orange-500/20",
    },
  ];

  return (
    <Card className="p-4 md:p-5 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-foreground">
            Ringkasan Hari Ini
          </h2>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            {today}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] md:text-xs">
          Live
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center gap-3 rounded-xl bg-card-alt/50 border border-border/50 p-3"
          >
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br shrink-0 ${metric.bgColor}`}
            >
              <metric.icon size={18} className={metric.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                {metric.label}
              </p>
              <p className="text-sm md:text-base font-bold text-foreground font-num tracking-tight">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
