"use server";

import { db } from "@/db";
import { financialTransactions, orders, orderItems } from "@/db/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTransactions(filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  const conditions = [];
  if (filters?.type) {
    conditions.push(eq(financialTransactions.type, filters.type as "masuk" | "keluar"));
  }
  if (filters?.startDate) {
    conditions.push(gte(financialTransactions.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(financialTransactions.date, filters.endDate));
  }

  return db
    .select()
    .from(financialTransactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(financialTransactions.createdAt));
}

export async function createTransaction(data: {
  date: string;
  type: "masuk" | "keluar";
  category: string;
  description: string;
  amount: number;
  createdBy?: string;
}) {
  await db.insert(financialTransactions).values({
    date: data.date,
    type: data.type,
    category: data.category,
    description: data.description,
    amount: data.amount,
    createdBy: data.createdBy || null,
  });

  revalidatePath("/keuangan");
}

export async function getDailyReconciliation(date: string) {
  const dayTransactions = await db
    .select()
    .from(financialTransactions)
    .where(eq(financialTransactions.date, date));

  const income = dayTransactions
    .filter((t) => t.type === "masuk")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = dayTransactions
    .filter((t) => t.type === "keluar")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    date,
    income,
    expense,
    net: income - expense,
    transactions: dayTransactions,
  };
}

export async function getProfitLossReport(startDate: string, endDate: string) {
  // Get all completed orders in range
  const orderList = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, new Date(startDate)),
        lte(orders.date, new Date(endDate))
      )
    );

  const orderIds = orderList.map((o) => o.id);
  let totalCOGS = 0;

  if (orderIds.length > 0) {
    for (const oid of orderIds) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, oid));
      totalCOGS += items.reduce((sum, item) => sum + item.costPrice * item.qty, 0);
    }
  }

  const grossRevenue = orderList.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDiscounts = orderList.reduce((sum, o) => sum + o.discountAmount, 0);
  const netRevenue = grossRevenue - totalDiscounts;
  const grossProfit = netRevenue - totalCOGS;

  // Get expenses
  const expenses = await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.type, "keluar"),
        gte(financialTransactions.date, startDate),
        lte(financialTransactions.date, endDate)
      )
    );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  return {
    grossRevenue,
    totalDiscounts,
    netRevenue,
    totalCOGS,
    grossProfit,
    totalExpenses,
    netProfit,
    orderCount: orderList.length,
  };
}
