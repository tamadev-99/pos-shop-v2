import { getReturns } from "@/lib/actions/returns";
import ReturClient from "./retur-client";

export default async function ReturPage() {
  const dbReturns = await getReturns();

  // Map to the shape expected by the client
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
    customer: r.customerId || "Pelanggan Umum",
    items: r.items.map((i) => ({
      product: `${i.productName} ${i.variantInfo ? `(${i.variantInfo})` : ""}`.trim(),
      qty: i.qty,
      price: i.unitPrice,
    })),
    refundAmount: r.refundAmount || 0,
    status: r.status,
    reason: r.reason,
    refundMethod: r.refundMethod || "Tunai",
    adminNotes: r.processedBy ? `Diproses oleh: ${r.processedBy}` : "",
  }));

  return <ReturClient initialReturns={mappedReturns as any} />;
}
