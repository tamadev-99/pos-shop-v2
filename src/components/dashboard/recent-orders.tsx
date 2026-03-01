"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

export interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  time: string;
}

interface RecentOrdersProps {
  orders: RecentOrder[];
}

const statusVariant = {
  selesai: "success" as const,
  dibatalkan: "destructive" as const,
  pending: "warning" as const,
};

export function RecentOrders({ orders }: RecentOrdersProps) {
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
