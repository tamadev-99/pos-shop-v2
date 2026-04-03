"use server";

import { db } from "@/db";
import { subscriptionPlans, subscriptionTransactions, tenants } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans() {
  return await db.query.subscriptionPlans.findMany({
    orderBy: [subscriptionPlans.price],
  });
}

/**
 * Update a plan's price (Admin only)
 */
export async function updatePlanPrice(planId: string, newPrice: string) {
  await db.update(subscriptionPlans)
    .set({ 
      price: newPrice,
      updatedAt: new Date()
    })
    .where(eq(subscriptionPlans.id, planId));
  
  revalidatePath("/admin/plans");
  return { success: true };
}

/**
 * Get platform-wide stats for Super Admin dashboard
 */
export async function getPlatformStats() {
  const allTenants = await db.select().from(tenants);
  const paidTransactions = await db.select()
    .from(subscriptionTransactions)
    .where(eq(subscriptionTransactions.status, "paid"));

  // Calculate total revenue from transactions
  const totalRevenue = paidTransactions.reduce((acc, curr) => acc + parseInt(curr.amount), 0);

  // Active vs Trial vs Expired
  const activeCount = allTenants.filter(t => t.subscriptionStatus === "active").length;
  const trialCount = allTenants.filter(t => t.subscriptionStatus === "trial").length;
  const expiredCount = allTenants.filter(t => t.subscriptionStatus === "expired").length;

  return {
    totalTenants: allTenants.length,
    totalRevenue,
    activeCount,
    trialCount,
    expiredCount,
    recentTransactions: await db.query.subscriptionTransactions.findMany({
      with: {
        tenant: true,
        plan: true,
      },
      orderBy: [desc(subscriptionTransactions.createdAt)],
      limit: 10,
    })
  };
}

/**
 * Get all transactions for the admin panel
 */
export async function getAllTransactions() {
  return await db.query.subscriptionTransactions.findMany({
    with: {
      tenant: true,
      plan: true,
    },
    orderBy: [desc(subscriptionTransactions.createdAt)],
  });
}
