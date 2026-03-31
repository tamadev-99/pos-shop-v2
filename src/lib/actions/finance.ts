"use server";

import { db } from "@/db";
import { financialTransactions, orders, orderItems, dailyReconciliations } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

export async function getTransactions(filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  const storeId = await getActiveStoreId();
  const conditions = [eq(financialTransactions.storeId, storeId)];

  if (filters?.type) {
    conditions.push(eq(financialTransactions.type, filters.type as "masuk" | "keluar"));
  }
  if (filters?.startDate) {
    conditions.push(gte(financialTransactions.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(financialTransactions.date, filters.endDate));
  }

  return db.query.financialTransactions.findMany({
    where: and(...conditions),
    orderBy: [desc(financialTransactions.createdAt)],
    with: { employee: true },
  });
}

export async function createTransaction(data: {
  date: string;
  type: "masuk" | "keluar";
  category: string;
  description: string;
  amount: number;
}) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  await db.insert(financialTransactions).values({
    date: data.date,
    type: data.type,
    category: data.category,
    description: data.description,
    amount: data.amount,
    storeId,
    employeeProfileId,
  });

  createAuditLog({
    userName,
    action: "keuangan",
    detail: `Transaksi ${data.type} dibuat: ${data.description} (Rp ${data.amount.toLocaleString("id-ID")})`,
    metadata: { type: data.type, category: data.category, amount: data.amount },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/laporan");
}

export async function getDailyReconciliation(date: string) {
  const storeId = await getActiveStoreId();

  const dayTransactions = await db.query.financialTransactions.findMany({
      where: and(eq(financialTransactions.date, date), eq(financialTransactions.storeId, storeId)),
      with: { employee: true }
    });

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
  const storeId = await getActiveStoreId();
  return db.query.dailyReconciliations.findFirst({
    where: and(eq(dailyReconciliations.date, date), eq(dailyReconciliations.storeId, storeId)),
    with: { employee: true }
  });
}

export async function saveDailyReconciliation(data: {
  date: string;
  calculatedIncome: number;
  calculatedExpense: number;
  actualCashInHand: number;
  notes?: string;
}) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  const difference = data.actualCashInHand - (data.calculatedIncome - data.calculatedExpense);

  const existing = await getReconciliationLog(data.date);

  if (existing) {
    await db.update(dailyReconciliations).set({
      calculatedIncome: data.calculatedIncome,
      calculatedExpense: data.calculatedExpense,
      actualCashInHand: data.actualCashInHand,
      difference,
      notes: data.notes || null,
      status: "completed",
      employeeProfileId,
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
      employeeProfileId,
      storeId,
    });
  }

  createAuditLog({
    userName,
    action: "keuangan",
    detail: `Rekonsiliasi harian disimpan untuk tanggal ${data.date}`,
    metadata: { date: data.date, difference, actualCashInHand: data.actualCashInHand },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/laporan");
}


export async function getProfitLossReport(startDate: string, endDate: string) {
  const storeId = await getActiveStoreId();

  const orderList = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        eq(orders.storeId, storeId),
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

  const expenses = await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.type, "keluar"),
        eq(financialTransactions.storeId, storeId),
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
  const storeId = await getActiveStoreId();

  const txList = await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.storeId, storeId),
        gte(financialTransactions.date, startDate),
        lte(financialTransactions.date, endDate)
      )
    )
    .orderBy(financialTransactions.date);

  const inflowByCategory: Record<string, number> = {};
  const outflowByCategory: Record<string, number> = {};
  let totalInflow = 0;
  let totalOutflow = 0;
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
