"use server";

import { db } from "@/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  purchaseOrderTimeline,
  productVariants,
  suppliers,
  financialTransactions,
} from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

function generatePOId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `PO-${date}-${rand}`;
}

export async function getPurchaseOrders(filters?: { status?: string }) {
  const storeId = await getActiveStoreId();
  const conditions = [eq(purchaseOrders.storeId, storeId)];

  if (filters?.status) {
    conditions.push(eq(purchaseOrders.status, filters.status as "diproses" | "dikirim" | "diterima" | "dibatalkan"));
  }

  return db.query.purchaseOrders.findMany({
    where: and(...conditions),
    with: {
      supplier: true,
      items: true,
      timeline: true,
      employee: true,
    },
    orderBy: [desc(purchaseOrders.createdAt)],
  });
}

export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDate?: string;
  dueDate?: string;
  items: {
    variantId: string;
    productName: string;
    variantInfo: string;
    qty: number;
    unitCost: number;
  }[];
  notes?: string;
}) {
  await requireRole("manager", "owner");
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  const poId = generatePOId();
  const today = new Date().toISOString().split("T")[0];
  const total = data.items.reduce((sum, item) => sum + item.unitCost * item.qty, 0);

  await db.insert(purchaseOrders).values({
    id: poId,
    supplierId: data.supplierId,
    date: today,
    expectedDate: data.expectedDate || null,
    dueDate: data.dueDate || null,
    status: "diproses",
    total,
    paidAmount: 0,
    paymentStatus: "belum_dibayar",
    notes: data.notes || null,
    employeeProfileId,
    storeId,
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
      storeId,
    }))
  );

  await db.insert(purchaseOrderTimeline).values({
    purchaseOrderId: poId,
    status: "Dibuat",
    note: "Purchase order dibuat",
    date: today,
    storeId,
  });

  await db
    .update(suppliers)
    .set({
      totalOrders: sql`${suppliers.totalOrders} + 1`,
      totalSpent: sql`${suppliers.totalSpent} + ${total}`,
    })
    .where(eq(suppliers.id, data.supplierId));

  createAuditLog({
    userName,
    action: "keuangan",
    detail: `Purchase order dibuat: ${poId}`,
    metadata: { poId, supplierId: data.supplierId, total, itemCount: data.items.length },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/pembelian");
  return poId;
}

export async function updatePOStatus(
  id: string,
  status: "diproses" | "dikirim" | "diterima" | "dibatalkan",
  note?: string
) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  const today = new Date().toISOString().split("T")[0];

  await db
    .update(purchaseOrders)
    .set({
      status,
      ...(status === "diterima" ? { receivedDate: today } : {}),
    })
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.storeId, storeId)));

  await db.insert(purchaseOrderTimeline).values({
    purchaseOrderId: id,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    note: note || `Status diubah ke ${status}`,
    date: today,
    storeId,
  });

  if (status === "diterima") {
    const po = await db.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, id), eq(purchaseOrders.storeId, storeId)),
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

  createAuditLog({
    userName,
    action: "keuangan",
    detail: `Status PO ${id} diubah ke ${status}`,
    metadata: { poId: id, status, note },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/pembelian");
  revalidatePath("/produk");
  revalidatePath("/laporan");
}
