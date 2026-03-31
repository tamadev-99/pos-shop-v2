import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getOrders } from "@/lib/actions/orders";
import { getReturns } from "@/lib/actions/returns";
import { getSettings } from "@/lib/actions/settings";
import PesananClient from "./pesanan-client";

export default async function PesananPage() {
  await enforceRouteAccess('/pesanan');
  const [ordersResult, dbReturns, storeSettings] = await Promise.all([
    getOrders(),
    getReturns(),
    getSettings(),
  ]);

  const orders = ordersResult.data;
  const totalOrders = ordersResult.totalRecords;

  const mappedReturns = dbReturns.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    date: new Date(r.createdAt).toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    customer: (r as any).customer?.name || "Pelanggan Umum",
    items: r.items.map((i) => ({
      product: `${i.productName} ${i.variantInfo ? `(${i.variantInfo})` : ""}`.trim(),
      qty: i.qty,
      price: i.unitPrice,
    })),
    refundAmount: r.refundAmount || 0,
    status: r.status,
    reason: r.reason,
    refundMethod: r.refundMethod || "tunai",
    adminNotes: (r as any).employee?.name ? `Diproses oleh: ${(r as any).employee.name}` : "",
  }));

  return (
    <PesananClient
      initialOrders={orders as any}
      initialReturns={mappedReturns as any}
      totalOrders={totalOrders}
      storeSettings={storeSettings}
    />
  );
}
