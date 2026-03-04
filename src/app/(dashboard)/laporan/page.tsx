import {
  getDailySalesReport,
  getMonthlySalesReport,
  getBestSellers,
  getInventoryValuation,
} from "@/lib/actions/reports";
import { getTransactions, getDailyReconciliation, getReconciliationLog } from "@/lib/actions/finance";
import { getExpenseCategories, getRecurringExpenses, processRecurringExpenses } from "@/lib/actions/expense-tracker";
import LaporanClient from "./laporan-client";

export default async function LaporanPage() {
  const now = new Date();
  const todayString = now.toISOString().split("T")[0];
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Process any due recurring expenses on page load
  processRecurringExpenses().catch(() => { });

  const [
    dailyReport,
    monthlyReport,
    bestSellers,
    inventoryValuation,
    transactions,
    todayReconciliation,
    todayReconciliationLog,
    categories,
    recurringExpensesList,
  ] = await Promise.all([
    getDailySalesReport(todayString),
    getMonthlySalesReport(year, month),
    getBestSellers(10),
    getInventoryValuation(),
    getTransactions(),
    getDailyReconciliation(todayString),
    getReconciliationLog(todayString),
    getExpenseCategories(),
    getRecurringExpenses(),
  ]);

  const totalPemasukan = transactions
    .filter((t: any) => t.type === "masuk")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalPengeluaran = transactions
    .filter((t: any) => t.type === "keluar")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const mappedTransactions = transactions.map((t: any) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    category: t.category,
    type: t.type === "masuk" ? "pemasukan" : "pengeluaran",
    amount: t.amount,
    attachmentUrl: t.attachmentUrl || null,
  }));

  const mappedCategories = categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    type: c.type === "masuk" ? ("pemasukan" as const) : ("pengeluaran" as const),
    isDefault: c.isDefault ?? false,
  }));

  const mappedRecurring = recurringExpensesList.map((r: any) => ({
    id: r.id,
    description: r.description,
    category: r.category,
    amount: r.amount,
    frequency: r.frequency,
    nextDueDate: r.nextDueDate,
  }));

  return (
    <LaporanClient
      dailyReport={dailyReport}
      monthlyReport={monthlyReport}
      bestSellers={bestSellers}
      inventoryValuation={inventoryValuation}
      initialTransactions={mappedTransactions}
      saldoKas={saldoKas}
      todayReconciliation={todayReconciliation}
      todayReconciliationLog={todayReconciliationLog}
      expenseCategories={mappedCategories}
      recurringExpenses={mappedRecurring}
    />
  );
}
