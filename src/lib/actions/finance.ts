"use server";

import { db } from "@/db";
import { financialTransactions, orders, orderItems, dailyReconciliations } from "@/db/schema";
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

export async function getReconciliationLog(date: string) {
  const log = await db
    .select()
    .from(dailyReconciliations)
    .where(eq(dailyReconciliations.date, date))
    .limit(1);

  return log.length > 0 ? log[0] : null;
}

export async function saveDailyReconciliation(data: {
  date: string;
  calculatedIncome: number;
  calculatedExpense: number;
  actualCashInHand: number;
  notes?: string;
  reconciledBy: string;
}) {
  const difference = data.actualCashInHand - (data.calculatedIncome - data.calculatedExpense);

  // Check if reconciliation already exists for the day
  const existing = await getReconciliationLog(data.date);

  if (existing) {
    await db.update(dailyReconciliations).set({
      calculatedIncome: data.calculatedIncome,
      calculatedExpense: data.calculatedExpense,
      actualCashInHand: data.actualCashInHand,
      difference,
      notes: data.notes || null,
      status: "completed",
      reconciledBy: data.reconciledBy,
      updatedAt: new Date()
    }).where(eq(dailyReconciliations.id, existing.id));
  } else {
    await db.insert(dailyReconciliations).values({
      date: data.date,
      calculatedIncome: data.calculatedIncome,
      calculatedExpense: data.calculatedExpense,
      actualCashInHand: data.actualCashInHand,
      difference,
      notes: data.notes || null,
      status: "completed",
      reconciledBy: data.reconciledBy
    });
  }

  revalidatePath("/laporan");
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

export async function getCashFlowReport(startDate: string, endDate: string) {
  const txList = await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        gte(financialTransactions.date, startDate),
        lte(financialTransactions.date, endDate)
      )
    )
    .orderBy(financialTransactions.date);

  // Group by category + type
  const inflowByCategory: Record<string, number> = {};
  const outflowByCategory: Record<string, number> = {};
  let totalInflow = 0;
  let totalOutflow = 0;

  // Daily breakdown for chart
  const dailyMap = new Map<string, { inflow: number; outflow: number }>();

  for (const tx of txList) {
    if (tx.type === "masuk") {
      inflowByCategory[tx.category] = (inflowByCategory[tx.category] || 0) + tx.amount;
      totalInflow += tx.amount;
    } else {
      outflowByCategory[tx.category] = (outflowByCategory[tx.category] || 0) + tx.amount;
      totalOutflow += tx.amount;
    }

    if (!dailyMap.has(tx.date)) {
      dailyMap.set(tx.date, { inflow: 0, outflow: 0 });
    }
    const day = dailyMap.get(tx.date)!;
    if (tx.type === "masuk") {
      day.inflow += tx.amount;
    } else {
      day.outflow += tx.amount;
    }
  }

  const inflows = Object.entries(inflowByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const outflows = Object.entries(outflowByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalInflow,
    totalOutflow,
    netCashFlow: totalInflow - totalOutflow,
    inflows,
    outflows,
    dailyBreakdown,
    transactionCount: txList.length,
  };
}
