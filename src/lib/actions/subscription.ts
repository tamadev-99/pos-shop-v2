"use server";

import { db } from "@/db";
import { tenants, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionContext } from "./store-context";

export type SubscriptionStatus = {
  status: "trial" | "active" | "expired";
  isBlocked: boolean;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  daysRemaining: number;
  tenantName: string | null;
  tenantEmail: string | null;
};

/**
 * Check if the current tenant has a valid subscription or trial.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { activeStoreId, userRole, userEmail } = await getSessionContext();

  // SaaS Admins are never blocked
  if (userRole === "saas-admin") {
    return {
      status: "active",
      isBlocked: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      daysRemaining: 999,
      tenantName: "Paltform Admin",
      tenantEmail: userEmail,
    };
  }

  if (!activeStoreId) {
    return {
      status: "active",
      isBlocked: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      daysRemaining: 0,
      tenantName: null,
      tenantEmail: null,
    };
  }

  // Get tenant info via store
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, activeStoreId),
    with: {
      tenant: {
        with: {
          owner: true,
        },
      },
    },
  });

  if (!store || !store.tenant) {
    throw new Error("Tenant context not found.");
  }

  const tenant = store.tenant;
  const now = new Date();
  
  let status: "trial" | "active" | "expired" = tenant.subscriptionStatus;
  let isBlocked = false;
  let expiryDate = tenant.subscriptionEndsAt || tenant.trialEndsAt;

  // Real-time expiry check
  if (expiryDate < now) {
    status = "expired";
    isBlocked = true;
  }

  const diffTime = Math.max(0, expiryDate.getTime() - now.getTime());
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    status,
    isBlocked,
    trialEndsAt: tenant.trialEndsAt,
    subscriptionEndsAt: tenant.subscriptionEndsAt,
    daysRemaining,
    tenantName: tenant.name,
    tenantEmail: tenant.owner.email,
  };
}

/**
 * Create a payment link for subscription renewal using Mayar.
 */
export async function createSubscriptionPaymentLink() {
  const status = await getSubscriptionStatus();
  if (!status.tenantName || !status.tenantEmail) {
    throw new Error("Tenant context missing for payment.");
  }

  // In a real scenario, you'd call Mayar API here.
  // For the sake of this agentic environment, we'll demonstrate using the Mayar tool 
  // if we were in the middle of a transaction, but since this is a server action,
  // we'd typically use a fetch/SDK call.
  
  // For now, return the plan details so the UI can prompt the user.
  return {
    amount: 100000,
    description: `Perpanjangan Langganan Noru POS - 30 Hari (${status.tenantName})`,
    email: status.tenantEmail,
    name: status.tenantName,
  };
}
