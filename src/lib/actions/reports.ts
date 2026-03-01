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

  const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = todayOrders.length;
  const avgTransaction = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Total products sold today
  let productsSold = 0;
  for (const order of todayOrders) {
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    productsSold += items.reduce((sum, item) => sum + item.qty, 0);
  }

  // Weekly data for chart
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setHours(23, 59, 59, 999);

    const dayOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "selesai"),
          gte(orders.date, d),
          lte(orders.date, dEnd)
        )
      );

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    weekData.push({
      day: dayNames[d.getDay()],
      penjualan: dayOrders.reduce((sum, o) => sum + o.total, 0),
    });
  }

  return {
    totalSales,
    totalOrders,
    avgTransaction,
    productsSold,
    weekData,
  };
}
