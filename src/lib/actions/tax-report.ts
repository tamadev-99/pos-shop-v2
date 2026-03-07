"use server";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function getTaxReport(startDate: string, endDate: string) {
  const orderList = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "selesai"),
        gte(orders.date, new Date(startDate)),
        lte(orders.date, new Date(endDate))
      )
    )
    .orderBy(desc(orders.date));

  let totalTax = 0;
  let taxableCount = 0;

  // Group by month: "YYYY-MM"
  const monthlyMap = new Map<string, { month: string; dpp: number; tax: number; total: number; orderCount: number }>();

  for (const o of orderList) {
    if (o.taxAmount > 0) {
      totalTax += o.taxAmount;
      taxableCount++;

      // Extract raw date YYYY-MM
      const yyyymm = o.date ? String(o.date.getFullYear()) + "-" + String(o.date.getMonth() + 1).padStart(2, '0') : "Unknown";
      
      if (!monthlyMap.has(yyyymm)) {
        monthlyMap.set(yyyymm, { month: yyyymm, dpp: 0, tax: 0, total: 0, orderCount: 0 });
      }
      const data = monthlyMap.get(yyyymm)!;
      
      data.tax += o.taxAmount;
      data.total += o.subtotal; 
      
      // DPP (Dasar Pengenaan Pajak) approx
      data.dpp += (o.subtotal - o.taxAmount);
      data.orderCount++;
    }
  }

  const monthlyReport = Array.from(monthlyMap.values()).sort((a, b) => b.month.localeCompare(a.month));

  return { totalTax, taxableCount, monthlyReport };
}
