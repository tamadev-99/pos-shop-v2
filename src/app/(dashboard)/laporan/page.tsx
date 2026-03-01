import {
  getDailySalesReport,
  getMonthlySalesReport,
  getBestSellers,
  getInventoryValuation,
} from "@/lib/actions/reports";
import LaporanClient from "./laporan-client";

export default async function LaporanPage() {
  const now = new Date();
  const todayString = now.toISOString().split("T")[0];
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  const [dailyReport, monthlyReport, bestSellers, inventoryValuation] =
    await Promise.all([
      getDailySalesReport(todayString),
      getMonthlySalesReport(year, month),
      getBestSellers(10),
      getInventoryValuation(),
    ]);

  return (
    <LaporanClient
      dailyReport={dailyReport}
      monthlyReport={monthlyReport}
      bestSellers={bestSellers}
      inventoryValuation={inventoryValuation}
    />
  );
}
