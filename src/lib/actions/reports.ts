"use server";

import { db } from "@/db";
import { orders, orderItems, productVariants, products, categories } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function getDailySalesReport(date: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const dayOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, startOfDay),
        lte(orders.date, endOfDay)
      )
    );

  const totalSales = dayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = dayOrders.length;
  const avgTransaction = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  return {
    date,
    totalSales,
    totalOrders,
    avgTransaction,
    orders: dayOrders,
  };
}

export async function getMonthlySalesReport(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const monthOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, startDate),
        lte(orders.date, endDate)
      )
    );

  const totalSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

  // Group by day
  const dailyBreakdown: Record<string, { sales: number; orders: number }> = {};
  for (const order of monthOrders) {
    const day = order.date.toISOString().split("T")[0];
    if (!dailyBreakdown[day]) {
      dailyBreakdown[day] = { sales: 0, orders: 0 };
    }
    dailyBreakdown[day].sales += order.total;
    dailyBreakdown[day].orders += 1;
  }

  return {
    year,
    month,
    totalSales,
    totalOrders: monthOrders.length,
    dailyBreakdown,
  };
}

export async function getBestSellers(limit = 10) {
  const result = await db
    .select({
      productName: orderItems.productName,
      totalQty: sql<number>`SUM(${orderItems.qty})::int`,
      totalRevenue: sql<number>`SUM(${orderItems.subtotal})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.status, "selesai"))
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`SUM(${orderItems.qty})`))
    .limit(limit);

  return result;
}

export async function getInventoryValuation() {
  const result = await db
    .select({
      totalValue: sql<number>`SUM(${productVariants.stock} * ${productVariants.buyPrice})::int`,
      totalItems: sql<number>`SUM(${productVariants.stock})::int`,
      totalSKUs: sql<number>`COUNT(*)::int`,
    })
    .from(productVariants)
    .where(eq(productVariants.status, "aktif"));

  return result[0] || { totalValue: 0, totalItems: 0, totalSKUs: 0 };
}

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Yesterday range
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  // Single query for today's order stats
  const todayOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, today),
        lte(orders.date, endOfDay)
      )
    );

  // Yesterday's orders for comparison
  const yesterdayOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, yesterday),
        lte(orders.date, endOfYesterday)
      )
    );

  const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = todayOrders.length;
  const avgTransaction = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
  const yesterdayOrderCount = yesterdayOrders.length;

  // Fix #4: Single JOIN query for products sold today (was N+1)
  const todayOrderIds = todayOrders.map((o) => o.id);
  let productsSold = 0;
  if (todayOrderIds.length > 0) {
    const soldResult = await db
      .select({
        totalQty: sql<number>`COALESCE(SUM(${orderItems.qty}), 0)::int`,
      })
      .from(orderItems)
      .where(
        sql`${orderItems.orderId} IN (${sql.join(todayOrderIds.map(id => sql`${id}`), sql`, `)})`
      );
    productsSold = soldResult[0]?.totalQty ?? 0;
  }

  // #13: Payment method breakdown
  const paymentBreakdown: Record<string, number> = {};
  for (const order of todayOrders) {
    const method = order.paymentMethod || "tunai";
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + order.total;
  }

  // #13: Low stock items (stock <= minStock)
  const lowStockItems = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      stock: productVariants.stock,
      minStock: productVariants.minStock,
      productName: products.name,
      color: productVariants.color,
      size: productVariants.size,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        eq(productVariants.status, "aktif"),
        sql`${productVariants.stock} <= ${productVariants.minStock}`
      )
    )
    .orderBy(productVariants.stock)
    .limit(10);

  // Fix #4: Single query for 7-day chart data (was 7 separate queries)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const weekOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, weekAgo),
        lte(orders.date, endOfDay)
      )
    );

  // Group by day in JS (faster than 7 DB queries)
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weekMap = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    weekMap.set(key, 0);
  }

  for (const order of weekOrders) {
    const key = order.date.toISOString().split("T")[0];
    weekMap.set(key, (weekMap.get(key) || 0) + order.total);
  }

  const weekData = Array.from(weekMap.entries()).map(([dateStr, sales]) => ({
    day: dayNames[new Date(dateStr).getDay()],
    penjualan: sales,
  }));

  return {
    totalSales,
    totalOrders,
    avgTransaction,
    productsSold,
    weekData,
    // New: #13 enrichment data
    yesterdaySales,
    yesterdayOrderCount,
    paymentBreakdown,
    lowStockItems,
  };
}
