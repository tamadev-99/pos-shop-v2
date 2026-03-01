"use server";

import { db } from "@/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  purchaseOrderTimeline,
  productVariants,
  suppliers,
} from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function generatePOId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `PO-${date}-${rand}`;
}

export async function getPurchaseOrders(filters?: { status?: string }) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(purchaseOrders.status, filters.status as "diproses" | "dikirim" | "diterima" | "dibatalkan"));
  }

  return db.query.purchaseOrders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      supplier: true,
      items: true,
      timeline: true,
    },
    orderBy: [desc(purchaseOrders.createdAt)],
  });
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDate?: string;
  items: {
    variantId: string;
    productName: string;
    variantInfo: string;
    qty: number;
    unitCost: number;
  }[];
  notes?: string;
  createdBy?: string;
}) {
  const poId = generatePOId();
  const today = new Date().toISOString().split("T")[0];
  const total = data.items.reduce((sum, item) => sum + item.unitCost * item.qty, 0);

  await db.insert(purchaseOrders).values({
    id: poId,
    supplierId: data.supplierId,
    date: today,
    expectedDate: data.expectedDate || null,
    status: "diproses",
    total,
    notes: data.notes || null,
    createdBy: data.createdBy || null,
  });

  await db.insert(purchaseOrderItems).values(
    data.items.map((item) => ({
      purchaseOrderId: poId,
      variantId: item.variantId,
      productName: item.productName,
      variantInfo: item.variantInfo,
      qty: item.qty,
      unitCost: item.unitCost,
      subtotal: item.unitCost * item.qty,
    }))
  );

  await db.insert(purchaseOrderTimeline).values({
    purchaseOrderId: poId,
    status: "Dibuat",
    note: "Purchase order dibuat",
    date: today,
  });

  // Update supplier stats
  await db
    .update(suppliers)
    .set({
      totalOrders: sql`${suppliers.totalOrders} + 1`,
      totalSpent: sql`${suppliers.totalSpent} + ${total}`,
    })
    .where(eq(suppliers.id, data.supplierId));

  revalidatePath("/pembelian");
  return poId;
}

export async function updatePOStatus(
  id: string,
  status: "diproses" | "dikirim" | "diterima" | "dibatalkan",
  note?: string
) {
  const today = new Date().toISOString().split("T")[0];

  await db
    .update(purchaseOrders)
    .set({
      status,
      ...(status === "diterima" ? { receivedDate: today } : {}),
    })
    .where(eq(purchaseOrders.id, id));

  await db.insert(purchaseOrderTimeline).values({
    purchaseOrderId: id,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    note: note || `Status diubah ke ${status}`,
    date: today,
  });

  // If received, increase stock
  if (status === "diterima") {
    const po = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
      with: { items: true },
    });

    if (po) {
      for (const item of po.items) {
        if (item.variantId) {
          await db
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.qty}` })
            .where(eq(productVariants.id, item.variantId));
        }
      }
    }
  }

  revalidatePath("/pembelian");
  revalidatePath("/inventaris");
}
