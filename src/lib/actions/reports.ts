"use server";

import { db } from "@/db";
import { orders, orderItems, productVariants, products, categories, customers, purchaseOrders } from "@/db/schema";
import { eq, desc, and, gte, lte, sql, isNotNull, asc } from "drizzle-orm";
import { getActiveStoreId } from "@/lib/actions/store-context";

export async function getDailySalesReport(date: string) {
  const storeId = await getActiveStoreId();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const dayOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        ...storeConditions,
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
  const storeId = await getActiveStoreId();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const monthOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        ...storeConditions,
        eq(orders.status, "selesai"),
        gte(orders.date, startDate),
        lte(orders.date, endDate)
      )
    );

  const totalSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

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
  const storeId = await getActiveStoreId();
  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const result = await db
    .select({
      productName: orderItems.productName,
      totalQty: sql<number>`SUM(${orderItems.qty})::int`,
      totalRevenue: sql<number>`SUM(${orderItems.subtotal})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.status, "selesai"), ...storeConditions))
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`SUM(${orderItems.qty})`))
    .limit(limit);

  return result;
}

export async function getInventoryValuation() {
  const storeId = await getActiveStoreId();
  const storeConditions = storeId ? [eq(productVariants.storeId, storeId)] : [];

  const result = await db
    .select({
      totalValue: sql<number>`SUM(${productVariants.stock} * ${productVariants.buyPrice})::int`,
      totalItems: sql<number>`SUM(${productVariants.stock})::int`,
      totalSKUs: sql<number>`COUNT(*)::int`,
    })
    .from(productVariants)
    .where(and(eq(productVariants.status, "aktif"), ...storeConditions));

  return result[0] || { totalValue: 0, totalItems: 0, totalSKUs: 0 };
}

export async function getDashboardStats() {
  const storeId = await getActiveStoreId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const todayStr = today.toISOString().split("T")[0];

  const orderStoreConditions = storeId ? [eq(orders.storeId, storeId)] : [];
  const customerStoreConditions = storeId ? [eq(customers.storeId, storeId)] : [];
  const poStoreConditions = storeId ? [eq(purchaseOrders.storeId, storeId)] : [];

  const [todayOrders, newCustomersResult, pendingPOsResult] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(
        and(
          ...orderStoreConditions,
          eq(orders.status, "selesai"),
          gte(orders.date, today),
          lte(orders.date, endOfDay)
        )
      ),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(customers)
      .where(and(...customerStoreConditions, eq(customers.joinDate, todayStr))),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(purchaseOrders)
      .where(
        and(
          ...poStoreConditions,
          sql`${purchaseOrders.status} IN ('diproses', 'dikirim')`
        )
      ),
  ]);

  const yesterdayOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        ...orderStoreConditions,
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

  const paymentBreakdown: Record<string, number> = {};
  for (const order of todayOrders) {
    const method = order.paymentMethod || "tunai";
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + order.total;
  }

  const productStoreConditions = storeId ? [eq(productVariants.storeId, storeId)] : [];

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
        ...productStoreConditions,
        eq(productVariants.status, "aktif"),
        sql`${productVariants.stock} <= ${productVariants.minStock}`
      )
    )
    .orderBy(productVariants.stock)
    .limit(10);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const weekOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        ...orderStoreConditions,
        eq(orders.status, "selesai"),
        gte(orders.date, weekAgo),
        lte(orders.date, endOfDay)
      )
    );

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

  const customerSet = new Set<string>();
  for (const order of todayOrders) {
    if (order.customerId) customerSet.add(order.customerId);
  }
  const uniqueCustomers = customerSet.size;

  const newCustomers = newCustomersResult[0]?.count ?? 0;
  const pendingPurchaseOrders = pendingPOsResult[0]?.count ?? 0;

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
        ...orderStoreConditions,
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
        ...orderStoreConditions,
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
    yesterdaySales,
    yesterdayOrderCount,
    paymentBreakdown,
    lowStockItems,
    grossProfit,
    uniqueCustomers,
    hourlySales,
    monthlySales,
    categorySales,
    newCustomers,
    pendingPurchaseOrders,
  };
}

// ═══════════════════════════════════════════════════════════
// Advanced Analytics Reports
// ═══════════════════════════════════════════════════════════

export async function getSalesByHourReport() {
  const storeId = await getActiveStoreId();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const result = await db
    .select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${orders.date})::int`,
      hourOfDay: sql<number>`EXTRACT(HOUR FROM ${orders.date})::int`,
      totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)::int`,
      totalOrders: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(
        ...storeConditions,
        eq(orders.status, "selesai"),
        gte(orders.date, thirtyDaysAgo)
      )
    )
    .groupBy(
      sql`EXTRACT(DOW FROM ${orders.date})`,
      sql`EXTRACT(HOUR FROM ${orders.date})`
    );

  const matrix: { sales: number; orders: number }[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ sales: 0, orders: 0 }))
  );

  for (const row of result) {
    matrix[row.dayOfWeek][row.hourOfDay] = {
      sales: row.totalSales,
      orders: row.totalOrders,
    };
  }

  return { matrix };
}

export async function getProductTrends(days: number = 30) {
  const storeId = await getActiveStoreId();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const topProducts = await db
    .select({
      productName: orderItems.productName,
      totalRevenue: sql<number>`SUM(${orderItems.subtotal})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        ...storeConditions,
        eq(orders.status, "selesai"),
        gte(orders.date, startDate)
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`SUM(${orderItems.subtotal})`))
    .limit(10);

  const productNames = topProducts.map((p) => p.productName);
  if (productNames.length === 0) {
    return { products: [], series: [] };
  }

  const dailyData = await db
    .select({
      date: sql<string>`TO_CHAR(${orders.date}, 'YYYY-MM-DD')`,
      productName: orderItems.productName,
      totalSales: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)::int`,
      totalQty: sql<number>`COALESCE(SUM(${orderItems.qty}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        ...storeConditions,
        eq(orders.status, "selesai"),
        gte(orders.date, startDate),
        sql`${orderItems.productName} IN (${sql.join(productNames.map(n => sql`${n}`), sql`, `)})`
      )
    )
    .groupBy(
      sql`TO_CHAR(${orders.date}, 'YYYY-MM-DD')`,
      orderItems.productName
    )
    .orderBy(sql`TO_CHAR(${orders.date}, 'YYYY-MM-DD')`);

  const dates: string[] = [];
  const d = new Date(startDate);
  const now = new Date();
  while (d <= now) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  const series: { productName: string; data: { date: string; sales: number; qty: number }[] }[] =
    productNames.map((name) => ({
      productName: name,
      data: dates.map((date) => {
        const match = dailyData.find((dd) => dd.date === date && dd.productName === name);
        return { date, sales: match?.totalSales ?? 0, qty: match?.totalQty ?? 0 };
      }),
    }));

  return { products: productNames, series };
}

export async function getProfitMarginReport() {
  const storeId = await getActiveStoreId();
  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const result = await db
    .select({
      categoryName: categories.name,
      revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)::int`,
      cogs: sql<number>`COALESCE(SUM(${orderItems.costPrice} * ${orderItems.qty}), 0)::int`,
      totalQty: sql<number>`COALESCE(SUM(${orderItems.qty}), 0)::int`,
      totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(orders.status, "selesai"), ...storeConditions))
    .groupBy(categories.name)
    .orderBy(desc(sql`SUM(${orderItems.subtotal})`));

  const data = result.map((r) => {
    const grossProfit = r.revenue - r.cogs;
    const marginPct = r.revenue > 0 ? Math.round((grossProfit / r.revenue) * 10000) / 100 : 0;
    return {
      categoryName: r.categoryName,
      revenue: r.revenue,
      cogs: r.cogs,
      grossProfit,
      marginPct,
      totalQty: r.totalQty,
      totalOrders: r.totalOrders,
    };
  });

  const totals = data.reduce(
    (acc, d) => ({
      revenue: acc.revenue + d.revenue,
      cogs: acc.cogs + d.cogs,
      grossProfit: acc.grossProfit + d.grossProfit,
    }),
    { revenue: 0, cogs: 0, grossProfit: 0 }
  );
  const overallMargin = totals.revenue > 0 ? Math.round((totals.grossProfit / totals.revenue) * 10000) / 100 : 0;

  return { categories: data, totals: { ...totals, marginPct: overallMargin } };
}

export async function getCustomerFrequencyReport() {
  const storeId = await getActiveStoreId();
  const storeConditions = storeId ? [eq(orders.storeId, storeId)] : [];

  const customerOrders = await db
    .select({
      customerId: orders.customerId,
      customerName: orders.customerName,
      orderDate: orders.date,
    })
    .from(orders)
    .where(
      and(
        ...storeConditions,
        eq(orders.status, "selesai"),
        isNotNull(orders.customerId)
      )
    )
    .orderBy(asc(orders.customerId), asc(orders.date));

  const customerMap = new Map<string, { name: string; dates: Date[] }>();
  for (const row of customerOrders) {
    if (!row.customerId) continue;
    if (!customerMap.has(row.customerId)) {
      customerMap.set(row.customerId, { name: row.customerName, dates: [] });
    }
    customerMap.get(row.customerId)!.dates.push(row.orderDate);
  }

  const customerStats: {
    customerId: string;
    customerName: string;
    totalOrders: number;
    avgDaysBetween: number | null;
    firstOrder: string;
    lastOrder: string;
  }[] = [];

  let totalCustomers = 0;
  let repeatCustomers = 0;

  for (const [customerId, data] of customerMap) {
    totalCustomers++;
    const totalOrders = data.dates.length;
    if (totalOrders > 1) repeatCustomers++;

    let avgDaysBetween: number | null = null;
    if (totalOrders >= 2) {
      let totalDays = 0;
      for (let i = 1; i < data.dates.length; i++) {
        const diff = (data.dates[i].getTime() - data.dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        totalDays += diff;
      }
      avgDaysBetween = Math.round((totalDays / (totalOrders - 1)) * 10) / 10;
    }

    customerStats.push({
      customerId,
      customerName: data.name,
      totalOrders,
      avgDaysBetween,
      firstOrder: data.dates[0].toISOString().split("T")[0],
      lastOrder: data.dates[data.dates.length - 1].toISOString().split("T")[0],
    });
  }

  customerStats.sort((a, b) => b.totalOrders - a.totalOrders);

  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 10000) / 100 : 0;

  return {
    customers: customerStats.slice(0, 50),
    summary: {
      totalCustomers,
      repeatCustomers,
      repeatRate,
      avgOrdersPerCustomer: totalCustomers > 0
        ? Math.round((customerStats.reduce((s, c) => s + c.totalOrders, 0) / totalCustomers) * 10) / 10
        : 0,
    },
  };
}
