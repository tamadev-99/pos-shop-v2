"use server";

import { db } from "@/db";
import { returns, returnItems, productVariants, financialTransactions, shifts, orders } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

function generateReturnId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `RTN-${date}-${rand}`;
}

export async function getReturns(filters?: { status?: string }) {
  const storeId = await getActiveStoreId();
  const conditions = [eq(returns.storeId, storeId)];

  if (filters?.status) {
    conditions.push(eq(returns.status, filters.status as "diproses" | "disetujui" | "ditolak" | "selesai"));
  }

  return db.query.returns.findMany({
    where: and(...conditions),
    with: { items: true, customer: true, employee: true },
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
  const { storeId, employeeProfileId, userName } = await getStoreContext();
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
    storeId,
    employeeProfileId: employeeProfileId || null,
  });

  await db.insert(returnItems).values(
    data.items.map((item) => ({
      returnId: id,
      variantId: item.variantId,
      productName: item.productName,
      variantInfo: item.variantInfo || "",
      qty: item.qty,
      unitPrice: item.unitPrice,
      storeId,
    }))
  );

  revalidatePath("/pesanan");

  createAuditLog({
    userName,
    action: "retur",
    detail: `Retur baru ${id} untuk pesanan ${data.orderId}`,
    metadata: { returnId: id, orderId: data.orderId, refundAmount },
    storeId,
    employeeProfileId,
  }).catch(() => { });

  return id;
}

export async function processReturn(
  id: string,
  decision: "disetujui" | "ditolak",
) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const returnRecord = await db.query.returns.findFirst({
    where: and(eq(returns.id, id), eq(returns.storeId, storeId)),
    with: { items: true },
  });

  if (!returnRecord) return;

  await db
    .update(returns)
    .set({
      status: decision === "disetujui" ? "selesai" : "ditolak",
    })
    .where(eq(returns.id, id));


  if (decision === "disetujui") {
    for (const item of returnRecord.items) {
      if (item.variantId) {
        await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.qty}` })
          .where(eq(productVariants.id, item.variantId));
      }
    }

    const today = new Date().toISOString().split("T")[0];
    await db.insert(financialTransactions).values({
      date: today,
      type: "keluar",
      category: "Retur",
      description: `Refund retur ${id}`,
      amount: returnRecord.refundAmount || 0,
      orderId: returnRecord.orderId,
      storeId,
      employeeProfileId: employeeProfileId || null,
    });

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

  revalidatePath("/pesanan");
  revalidatePath("/produk");
  revalidatePath("/laporan");

  createAuditLog({
    userName,
    action: "retur",
    detail: `Retur ${id} ${decision === "disetujui" ? "disetujui" : "ditolak"}`,
    metadata: { returnId: id, decision },
    storeId,
    employeeProfileId,
  }).catch(() => { });
}
