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

  // ── NEW: Gross Profit (Revenue - COGS) ──
  let grossProfit = 0;
  if (todayOrderIds.length > 0) {
    const profitResult = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)::int`,
        cogs: sql<number>`COALESCE(SUM(${orderItems.costPrice} * ${orderItems.qty}), 0)::int`,
      })
      .from(orderItems)
      .where(
        sql`${orderItems.orderId} IN (${sql.join(todayOrderIds.map(id => sql`${id}`), sql`, `)})`
      );
    grossProfit = (profitResult[0]?.revenue ?? 0) - (profitResult[0]?.cogs ?? 0);
  }

  // ── NEW: Unique customer count ──
  const customerSet = new Set<string>();
  for (const order of todayOrders) {
    if (order.customerId) customerSet.add(order.customerId);
  }
  const uniqueCustomers = customerSet.size;

  // ── NEW: Hourly sales breakdown (24h) ──
  const hourlySales: { hour: number; sales: number; orders: number }[] = [];
  const hourMap = new Map<number, { sales: number; orders: number }>();
  for (let h = 0; h < 24; h++) hourMap.set(h, { sales: 0, orders: 0 });
  for (const order of todayOrders) {
    const h = order.date.getHours();
    const entry = hourMap.get(h)!;
    entry.sales += order.total;
    entry.orders += 1;
  }
  for (const [hour, data] of hourMap) {
    hourlySales.push({ hour, ...data });
  }

  // ── NEW: Monthly sales (6 months) ──
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyOrders = await db
    .select({
      month: sql<string>`TO_CHAR(${orders.date}, 'YYYY-MM')`,
      totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)::int`,
      totalOrders: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, sixMonthsAgo)
      )
    )
    .groupBy(sql`TO_CHAR(${orders.date}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${orders.date}, 'YYYY-MM')`);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthlySales = monthlyOrders.map((m) => {
    const [, mm] = m.month.split("-");
    return {
      month: monthNames[parseInt(mm) - 1] || m.month,
      sales: m.totalSales,
      orders: m.totalOrders,
    };
  });

  // ── NEW: Category-level sales ──
  const categoryResult = await db
    .select({
      categoryName: categories.name,
      totalSales: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)::int`,
      totalQty: sql<number>`COALESCE(SUM(${orderItems.qty}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, weekAgo),
        lte(orders.date, endOfDay)
      )
    )
    .groupBy(categories.name)
    .orderBy(desc(sql`SUM(${orderItems.subtotal})`))
    .limit(8);

  const categorySales = categoryResult.map((c) => ({
    name: c.categoryName,
    sales: c.totalSales,
    qty: c.totalQty,
  }));

  return {
    totalSales,
    totalOrders,
    avgTransaction,
    productsSold,
    weekData,
    // #13 enrichment data
    yesterdaySales,
    yesterdayOrderCount,
    paymentBreakdown,
    lowStockItems,
    // Dashboard v2 data
    grossProfit,
    uniqueCustomers,
    hourlySales,
    monthlySales,
    categorySales,
  };
}
