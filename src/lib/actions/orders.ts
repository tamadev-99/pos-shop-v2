"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  productVariants,
  products,
  bundleItems,
  customers,
  financialTransactions,
  heldTransactions,
  shifts,
} from "@/db/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getCurrentUser } from "@/lib/actions/auth-helpers";
import { checkLowStock } from "@/lib/actions/notifications";
import { recalculateTier } from "@/lib/actions/customers";


export interface CreateOrderParams {
  customerId?: string | null;
  customerName?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: "tunai" | "debit" | "kredit" | "transfer" | "qris" | "ewallet";
  cashPaid?: number;
  changeAmount?: number;
  notes?: string;
  items: {
    variantId: string;
    productName: string;
    variantInfo: string;
    qty: number;
    unitPrice: number;
    costPrice: number;
  }[];
  cashierId?: string;
  shiftId?: string;
}

function generateOrderId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrder(data: CreateOrderParams) {
  const orderId = generateOrderId();
  const today = new Date().toISOString().split("T")[0];

  // Bug Fix #7: Validate stock before creating order
  for (const item of data.items) {
    const variant = await db
      .select({ stock: productVariants.stock, sku: productVariants.sku })
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId))
      .limit(1);

    if (!variant[0] || variant[0].stock < item.qty) {
      throw new Error(
        `Stok tidak cukup untuk ${item.productName} (${item.variantInfo}). Tersedia: ${variant[0]?.stock ?? 0}, Dibutuhkan: ${item.qty}`
      );
    }
  }

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
    cashPaid: data.cashPaid || null,
    changeAmount: data.changeAmount || null,
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

  // Deduct stock for each variant (bundle-aware)
  for (const item of data.items) {
    // Check if this variant belongs to a bundle product
    const variantWithProduct = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
      with: {
        product: {
          with: {
            bundleItems: true,
          },
        },
      },
    });

    if (variantWithProduct?.product?.isBundle && variantWithProduct.product.bundleItems.length > 0) {
      // Bundle product: deduct stock from each component variant
      for (const comp of variantWithProduct.product.bundleItems) {
        await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.qty * comp.quantity}` })
          .where(eq(productVariants.id, comp.componentVariantId));
      }
    } else {
      // Regular product: deduct stock normally
      await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.qty}` })
        .where(eq(productVariants.id, item.variantId));
    }
  }

  // Update customer spending & points, then recalculate tier
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

    // Auto-upgrade tier based on new totalSpent
    recalculateTier(data.customerId).catch(() => {});
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

  // Update active shift if any
  if (data.shiftId) {
    const isCash = data.paymentMethod === "tunai";

    await db
      .update(shifts)
      .set({
        totalSales: sql`${shifts.totalSales} + ${data.total}`,
        totalCashSales: isCash
          ? sql`${shifts.totalCashSales} + ${data.total}`
          : sql`${shifts.totalCashSales}`,
        totalNonCashSales: !isCash
          ? sql`${shifts.totalNonCashSales} + ${data.total}`
          : sql`${shifts.totalNonCashSales}`,
        totalTransactions: sql`${shifts.totalTransactions} + 1`,
      })
      .where(eq(shifts.id, data.shiftId));
  }

  revalidatePath("/");
  revalidatePath("/pos");
  revalidatePath("/pesanan");
  revalidatePath("/inventaris");
  revalidatePath("/pelanggan");
  revalidatePath("/keuangan");
  revalidatePath("/shift");

  // Audit log
  const currentUser = await getCurrentUser();
  createAuditLog({
    userId: currentUser?.id,
    userName: currentUser?.name || data.customerName || "Kasir",
    action: "transaksi",
    detail: `Pesanan baru ${orderId} — ${data.items.length} item, Total ${data.total}`,
    metadata: { orderId, total: data.total, paymentMethod: data.paymentMethod },
  }).catch(() => { });

  // Auto-check low stock after sale
  checkLowStock().catch(() => { });

  return orderId;
}

export async function getOrders(filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status as "pending" | "selesai" | "dibatalkan"));
  }
  if (filters.startDate) {
    conditions.push(gte(orders.date, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(orders.date, new Date(filters.endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.query.orders.findMany({
      where: whereClause,
      with: { items: true },
      orderBy: [desc(orders.createdAt)],
      limit: filters.limit,
      offset: filters.offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause)
  ]);

  return {
    data,
    totalRecords: Number(countResult[0]?.count || 0)
  };
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

  // Bug Fix #1: Reverse shift sales if order was linked to a shift
  if (order.shiftId) {
    const isCash = order.paymentMethod === "tunai";
    await db
      .update(shifts)
      .set({
        totalSales: sql`GREATEST(${shifts.totalSales} - ${order.total}, 0)`,
        totalCashSales: isCash
          ? sql`GREATEST(${shifts.totalCashSales} - ${order.total}, 0)`
          : sql`${shifts.totalCashSales}`,
        totalNonCashSales: !isCash
          ? sql`GREATEST(${shifts.totalNonCashSales} - ${order.total}, 0)`
          : sql`${shifts.totalNonCashSales}`,
        totalTransactions: sql`GREATEST(${shifts.totalTransactions} - 1, 0)`,
      })
      .where(eq(shifts.id, order.shiftId));
  }

  // Bug Fix #2: Delete the financial transaction for this order
  await db
    .delete(financialTransactions)
    .where(eq(financialTransactions.orderId, id));

  // Update order status
  await db.update(orders).set({ status: "dibatalkan" }).where(eq(orders.id, id));

  revalidatePath("/pesanan");
  revalidatePath("/inventaris");
  revalidatePath("/keuangan");
  revalidatePath("/shift");

  const currentUser2 = await getCurrentUser();
  createAuditLog({
    userId: currentUser2?.id,
    userName: currentUser2?.name || "Kasir",
    action: "transaksi",
    detail: `Pesanan ${id} dibatalkan`,
    metadata: { orderId: id },
  }).catch(() => { });
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

export async function getOrdersByCustomerId(customerId: string) {
  return db.query.orders.findMany({
    where: eq(orders.customerId, customerId),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 20,
  });
}
