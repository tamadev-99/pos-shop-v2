"use server";

import { db } from "@/db";
import { tenants, stores, subscriptionPlans, subscriptionTransactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userRole = (session.user as any).role;
  const userEmail = session.user.email;

  // SaaS Admins are never blocked and don't need a store
  if (userRole === "saas-admin") {
    return {
      status: "active",
      isBlocked: false,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      daysRemaining: 999,
      tenantName: "Platform Admin",
      tenantEmail: userEmail,
    };
  }

  const activeStoreId = (session.session as any).activeStoreId;

  if (!activeStoreId) {
    // If not a saas-admin and no store selected, 
    // we should let them through to the selection page
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
 * Create a payment invoice for subscription renewal using Mayar.
 */
export async function createSubscriptionPaymentLink() {
  const { activeStoreId } = await getSessionContext();
  if (!activeStoreId) throw new Error("No active store found.");

  // Get current plan (default to the first active one if not set)
  let plan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.isActive, true),
    orderBy: [subscriptionPlans.price],
  });

  if (!plan) {
    // Fallback if no plan exists yet (should be seeded)
    throw new Error("No subscription plans available. Please contact admin.");
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
  const baseUrl = process.env.MAYAR_API_URL || "https://api.mayar.id/hl/v1/invoice/create";
  const apiKey = process.env.MAYAR_API_KEY;

  if (!apiKey) {
    throw new Error("MAYAR_API_KEY is not configured.");
  }

  const basePrice = parseInt(plan.price);
  const ppn = Math.floor(basePrice * 0.11);
  const total = basePrice + ppn;

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tenant.owner.name,
        email: tenant.owner.email,
        mobile: "081234567890", // Default placeholder
        description: `Perpanjangan Langganan Noru POS - 30 Hari (${tenant.name})`,
        items: [
          {
            description: `${plan.name} (30 Hari)`,
            quantity: 1,
            rate: basePrice,
          },
          {
            description: "PPN (11%)",
            quantity: 1,
            rate: ppn,
          }
        ],
        metadata: {
          tenantId: tenant.id,
          planId: plan.id,
          type: "subscription_renewal"
        },
        // Optional: redirect back to dashboard after payment
        redirectURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Mayar API Error:", result);
      throw new Error(result.message || "Failed to create invoice with Mayar.");
    }

    return {
      url: result.url, // URL to Mayar Invoice page
      amount: total,
      invoiceId: result.id
    };
  } catch (error) {
    console.error("Mayar Integration Error:", error);
    throw error;
  }
}


