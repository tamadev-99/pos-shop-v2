"use server";

import { db } from "@/db";
import { returns, returnItems, productVariants, financialTransactions, shifts, orders } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getCurrentUser } from "@/lib/actions/auth-helpers";

function generateReturnId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `RTN-${date}-${rand}`;
}

export async function getReturns(filters?: { status?: string }) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(returns.status, filters.status as "diproses" | "disetujui" | "ditolak" | "selesai"));
  }

  return db.query.returns.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { items: true, customer: true },
    orderBy: [desc(returns.createdAt)],
  });
}

export async function createReturn(data: {
  orderId: string;
  customerId?: string;
  reason: string;
  refundMethod?: "tunai" | "transfer" | "poin";
  items: {
    variantId: string;
    productName: string;
    variantInfo?: string;
    qty: number;
    unitPrice: number;
  }[];
}) {
  const id = generateReturnId();
  const today = new Date().toISOString().split("T")[0];
  const refundAmount = data.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  await db.insert(returns).values({
    id,
    orderId: data.orderId,
    customerId: data.customerId || null,
    date: today,
    reason: data.reason,
    refundMethod: data.refundMethod || null,
    refundAmount,
  });

  await db.insert(returnItems).values(
    data.items.map((item) => ({
      returnId: id,
      variantId: item.variantId,
      productName: item.productName,
      variantInfo: item.variantInfo || "",
      qty: item.qty,
      unitPrice: item.unitPrice,
    }))
  );

  revalidatePath("/retur");

  const currentUser = await getCurrentUser();
  createAuditLog({
    userId: currentUser?.id,
    userName: currentUser?.name || "Admin",
    action: "retur",
    detail: `Retur baru ${id} untuk pesanan ${data.orderId}`,
    metadata: { returnId: id, orderId: data.orderId, refundAmount },
  }).catch(() => { });

  return id;
}

export async function processReturn(
  id: string,
  decision: "disetujui" | "ditolak",
  processedBy?: string
) {
  const returnRecord = await db.query.returns.findFirst({
    where: eq(returns.id, id),
    with: { items: true },
  });

  if (!returnRecord) return;

  await db
    .update(returns)
    .set({
      status: decision === "disetujui" ? "selesai" : "ditolak",
      processedBy: processedBy || null,
    })
    .where(eq(returns.id, id));

  if (decision === "disetujui") {
    // Restore stock
    for (const item of returnRecord.items) {
      if (item.variantId) {
        await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.qty}` })
          .where(eq(productVariants.id, item.variantId));
      }
    }

    // Create refund financial entry
    const today = new Date().toISOString().split("T")[0];
    await db.insert(financialTransactions).values({
      date: today,
      type: "keluar",
      category: "Retur",
      description: `Refund retur ${id}`,
      amount: returnRecord.refundAmount || 0,
      orderId: returnRecord.orderId,
    });

    // Bug Fix #2: Deduct shift sales if the order was linked to a shift
    const originalOrder = await db.query.orders.findFirst({
      where: eq(orders.id, returnRecord.orderId),
    });

    if (originalOrder && originalOrder.shiftId && returnRecord.refundAmount) {
      const isCash = originalOrder.paymentMethod === "tunai";
      await db
        .update(shifts)
        .set({
          totalSales: sql`GREATEST(${shifts.totalSales} - ${returnRecord.refundAmount}, 0)`,
          totalCashSales: isCash
            ? sql`GREATEST(${shifts.totalCashSales} - ${returnRecord.refundAmount}, 0)`
            : sql`${shifts.totalCashSales}`,
          totalNonCashSales: !isCash
            ? sql`GREATEST(${shifts.totalNonCashSales} - ${returnRecord.refundAmount}, 0)`
            : sql`${shifts.totalNonCashSales}`,
        })
        .where(eq(shifts.id, originalOrder.shiftId));
    }
  }

  revalidatePath("/retur");
  revalidatePath("/inventaris");
  revalidatePath("/keuangan");

  const currentUser2 = await getCurrentUser();
  createAuditLog({
    userId: currentUser2?.id,
    userName: currentUser2?.name || processedBy || "Admin",
    action: "retur",
    detail: `Retur ${id} ${decision === "disetujui" ? "disetujui" : "ditolak"}`,
    metadata: { returnId: id, decision },
  }).catch(() => { });
}
