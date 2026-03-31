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
import { getStoreContext, getActiveStoreId } from "@/lib/actions/store-context";
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
  bankName?: string;
  referenceNumber?: string;
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
  shiftId?: string;
}

function generateOrderId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createOrder(data: CreateOrderParams) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  const orderId = generateOrderId();
  const today = new Date().toISOString().split("T")[0];

  // Validate stock and wholesale pricing before creating order
  for (const item of data.items) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
      with: {
        wholesaleTiers: true,
      },
    });

    if (!variant || variant.stock < item.qty) {
      throw new Error(
        `Stok tidak cukup untuk ${item.productName} (${item.variantInfo}). Tersedia: ${variant?.stock ?? 0}, Dibutuhkan: ${item.qty}`
      );
    }

    // Server-side strict validation for wholesale tiers (Phase 6 requirement)
    let expectedPrice = variant.sellPrice;
    if (variant.wholesaleTiers && variant.wholesaleTiers.length > 0) {
      const applicableTier = variant.wholesaleTiers
        .filter((t) => item.qty >= t.minQty)
        .sort((a, b) => b.minQty - a.minQty)[0];
      if (applicableTier) {
        expectedPrice = applicableTier.price;
      }
    }

    if (item.unitPrice !== expectedPrice) {
      throw new Error(
        `Validasi Harga Gagal: ${item.productName} (${item.variantInfo}) dikirim dengan harga Rp${item.unitPrice}, namun harga valid (dengan kuantitas ${item.qty}) adalah Rp${expectedPrice}.`
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
    bankName: data.bankName || null,
    referenceNumber: data.referenceNumber || null,
    cashPaid: data.cashPaid || null,
    changeAmount: data.changeAmount || null,
    employeeProfileId: employeeProfileId || null,
    storeId,
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
      storeId,
    }))
  );

  // Deduct stock for each variant (bundle-aware)
  for (const item of data.items) {
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
      for (const comp of variantWithProduct.product.bundleItems) {
        await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.qty * comp.quantity}` })
          .where(eq(productVariants.id, comp.componentVariantId));
      }
    } else {
      await db
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.qty}` })
        .where(eq(productVariants.id, item.variantId));
    }
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

    recalculateTier(data.customerId).catch(() => { });
  }

  // Create financial transaction
  await db.insert(financialTransactions).values({
    date: today,
    type: "masuk",
    category: "Penjualan",
    description: `Penjualan ${orderId}`,
    amount: data.total,
    orderId,
    storeId,
    employeeProfileId: employeeProfileId || null,
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
  revalidatePath("/produk");
  revalidatePath("/kontak");
  revalidatePath("/laporan");
  revalidatePath("/shift");

  // Audit log
  createAuditLog({
    userName,
    action: "transaksi",
    detail: `Pesanan baru ${orderId} — ${data.items.length} item, Total ${data.total}`,
    metadata: { orderId, total: data.total, paymentMethod: data.paymentMethod },
    storeId,
    employeeProfileId,
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
  const storeId = await getActiveStoreId();
  const conditions = [eq(orders.storeId, storeId)];

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status as "pending" | "selesai" | "dibatalkan"));
  }
  if (filters.startDate) {
    conditions.push(gte(orders.date, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(orders.date, new Date(filters.endDate)));
  }

  const whereClause = and(...conditions);

  const [data, countResult] = await Promise.all([
    db.query.orders.findMany({
      where: whereClause,
      with: { items: true, employee: true },
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
  const storeId = await getActiveStoreId();
  return db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.storeId, storeId)),
    with: { items: true, employee: true },
  });
}

export async function cancelOrder(id: string) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.storeId, storeId)),
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

  // Reverse shift sales
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

  // Delete the financial transaction
  await db
    .delete(financialTransactions)
    .where(eq(financialTransactions.orderId, id));

  // Update order status
  await db.update(orders).set({ status: "dibatalkan" }).where(eq(orders.id, id));

  revalidatePath("/pesanan");
  revalidatePath("/produk");
  revalidatePath("/laporan");
  revalidatePath("/shift");

  createAuditLog({
    userName,
    action: "transaksi",
    detail: `Pesanan ${id} dibatalkan`,
    metadata: { orderId: id },
    storeId,
    employeeProfileId,
  }).catch(() => { });
}

export async function holdTransaction(data: {
  customerName?: string;
  customerId?: string;
  items: unknown[];
  shippingFee?: number;
  notes?: string;
}) {
  const { storeId, employeeProfileId } = await getStoreContext();
  const id = crypto.randomUUID();

  await db.insert(heldTransactions).values({
    id,
    employeeProfileId: employeeProfileId || null,
    customerName: data.customerName || null,
    customerId: data.customerId || null,
    items: data.items,
    shippingFee: data.shippingFee || 0,
    notes: data.notes || null,
    storeId,
  });

  revalidatePath("/pos");
  return id;
}

export async function getHeldTransactions() {
  const storeId = await getActiveStoreId();
  return db
    .select()
    .from(heldTransactions)
    .where(eq(heldTransactions.storeId, storeId))
    .orderBy(desc(heldTransactions.createdAt));
}

export async function deleteHeldTransaction(id: string) {
  await db.delete(heldTransactions).where(eq(heldTransactions.id, id));
  revalidatePath("/pos");
}

export async function getOrdersByCustomerId(customerId: string) {
  const storeId = await getActiveStoreId();
  return db.query.orders.findMany({
    where: and(eq(orders.customerId, customerId), eq(orders.storeId, storeId)),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 20,
  });
}
