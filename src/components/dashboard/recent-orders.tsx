"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

const orders = [
  { id: "ORD-001", customer: "Pelanggan Umum", total: 125000, status: "selesai", time: "14:32" },
  { id: "ORD-002", customer: "Budi Santoso", total: 287000, status: "selesai", time: "14:15" },
  { id: "ORD-003", customer: "Pelanggan Umum", total: 54000, status: "selesai", time: "13:48" },
  { id: "ORD-004", customer: "Siti Rahayu", total: 412000, status: "selesai", time: "13:22" },
  { id: "ORD-005", customer: "Pelanggan Umum", total: 78000, status: "dibatalkan", time: "12:55" },
];

const statusVariant = {
  selesai: "success" as const,
  dibatalkan: "destructive" as const,
  pending: "warning" as const,
};

export function RecentOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesanan Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground font-num">
                    {order.id}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.customer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[order.status as keyof typeof statusVariant]}>
                  {order.status}
                </Badge>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground font-num">
                    {formatRupiah(order.total)}
                  </p>
                  <p className="text-[10px] text-muted-dim font-num">
                    {order.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
