"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  productVariants,
  customers,
  financialTransactions,
  heldTransactions,
} from "@/db/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function generateOrderId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrder(data: {
  customerId?: string;
  customerName?: string;
  items: {
    variantId: string;
    productName: string;
    variantInfo: string;
    qty: number;
    unitPrice: number;
    costPrice: number;
  }[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingFee?: number;
  total: number;
  paymentMethod: "tunai" | "debit" | "kredit" | "transfer" | "qris" | "ewallet";
  cashierId?: string;
  shiftId?: string;
  notes?: string;
}) {
  const orderId = generateOrderId();
  const today = new Date().toISOString().split("T")[0];

  // Create order
  await db.insert(orders).values({
    id: orderId,
    customerId: data.customerId || null,
    customerName: data.customerName || "Pelanggan Umum",
    subtotal: data.subtotal,
    discountAmount: data.discountAmount || 0,
    taxAmount: data.taxAmount || 0,
    shippingFee: data.shippingFee || 0,
    total: data.total,
    paymentMethod: data.paymentMethod,
    cashierId: data.cashierId || null,
    shiftId: data.shiftId || null,
    notes: data.notes || null,
    status: "selesai",
  });

  // Create order items
  await db.insert(orderItems).values(
    data.items.map((item) => ({
      orderId,
      variantId: item.variantId,
      productName: item.productName,
      variantInfo: item.variantInfo,
      qty: item.qty,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      subtotal: item.unitPrice * item.qty,
    }))
  );

  // Deduct stock for each variant
  for (const item of data.items) {
    await db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} - ${item.qty}` })
      .where(eq(productVariants.id, item.variantId));
  }

  // Update customer spending & points
  if (data.customerId) {
    const pointsEarned = Math.floor(data.total / 1000);
    await db
      .update(customers)
      .set({
        totalSpent: sql`${customers.totalSpent} + ${data.total}`,
        points: sql`${customers.points} + ${pointsEarned}`,
        lastPurchase: today,
      })
      .where(eq(customers.id, data.customerId));
  }

  // Create financial transaction
  await db.insert(financialTransactions).values({
    date: today,
    type: "masuk",
    category: "Penjualan",
    description: `Penjualan ${orderId}`,
    amount: data.total,
    orderId,
    createdBy: data.cashierId || null,
  });

  revalidatePath("/");
  revalidatePath("/pos");
  revalidatePath("/pesanan");
  revalidatePath("/inventaris");
  revalidatePath("/pelanggan");
  revalidatePath("/keuangan");

  return orderId;
}

export async function getOrders(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as "pending" | "selesai" | "dibatalkan"));
  }
  if (filters?.startDate) {
    conditions.push(gte(orders.date, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(orders.date, new Date(filters.endDate)));
  }

  return db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: filters?.limit,
  });
}

export async function getOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });
}

export async function cancelOrder(id: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order) return;

  // Restore stock
  for (const item of order.items) {
    if (item.variantId) {
      await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${item.qty}` })
        .where(eq(productVariants.id, item.variantId));
    }
  }

  // Update order status
  await db.update(orders).set({ status: "dibatalkan" }).where(eq(orders.id, id));

  revalidatePath("/pesanan");
  revalidatePath("/inventaris");
  revalidatePath("/keuangan");
}

export async function holdTransaction(data: {
  cashierId?: string;
  customerName?: string;
  customerId?: string;
  items: unknown[];
  shippingFee?: number;
  notes?: string;
}) {
  const id = crypto.randomUUID();
  await db.insert(heldTransactions).values({
    id,
    cashierId: data.cashierId || null,
    customerName: data.customerName || null,
    customerId: data.customerId || null,
    items: data.items,
    shippingFee: data.shippingFee || 0,
    notes: data.notes || null,
  });

  revalidatePath("/pos");
  return id;
}

export async function getHeldTransactions() {
  return db.select().from(heldTransactions).orderBy(desc(heldTransactions.createdAt));
}

export async function deleteHeldTransaction(id: string) {
  await db.delete(heldTransactions).where(eq(heldTransactions.id, id));
  revalidatePath("/pos");
}
