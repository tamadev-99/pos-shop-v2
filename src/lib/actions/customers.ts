"use server";

import { db } from "@/db";
import { customers, storeSettings } from "@/db/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getCurrentUser } from "@/lib/actions/auth-helpers";

export async function getCustomers(filters?: { search?: string; tier?: string }) {
  const conditions = [];
  if (filters?.search) {
    conditions.push(like(customers.name, `%${filters.search}%`));
  }
  if (filters?.tier) {
    conditions.push(eq(customers.tier, filters.tier as "Bronze" | "Silver" | "Gold" | "Platinum"));
  }

  return db
    .select()
    .from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: string) {
  return db.query.customers.findFirst({
    where: eq(customers.id, id),
  });
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  birthDate?: string;
}) {
  const id = crypto.randomUUID();
  const today = new Date().toISOString().split("T")[0];

  await db.insert(customers).values({
    id,
    name: data.name,
    phone: data.phone,
    email: data.email || "",
    address: data.address || "",
    birthDate: data.birthDate,
    joinDate: today,
  });

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "pelanggan",
      detail: `Pelanggan baru ditambahkan: ${data.name}`,
      metadata: { customerId: id, name: data.name, phone: data.phone },
    }).catch(() => {});
  }

  revalidatePath("/pelanggan");
  return id;
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    birthDate: string;
  }>
) {
  await db.update(customers).set(data).where(eq(customers.id, id));

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "pelanggan",
      detail: `Data pelanggan diperbarui`,
      metadata: { customerId: id, changes: data },
    }).catch(() => {});
  }

  revalidatePath("/pelanggan");
}

export async function addLoyaltyPoints(customerId: string, points: number) {
  await db
    .update(customers)
    .set({
      points: sql`${customers.points} + ${points}`,
    })
    .where(eq(customers.id, customerId));

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "pelanggan",
      detail: `Poin loyalitas ditambahkan: +${points} poin`,
      metadata: { customerId, pointsAdded: points },
    }).catch(() => {});
  }

  await recalculateTier(customerId);
  revalidatePath("/pelanggan");
}

export async function redeemPoints(customerId: string, points: number) {
  await db
    .update(customers)
    .set({
      points: sql`${customers.points} - ${points}`,
    })
    .where(eq(customers.id, customerId));

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "pelanggan",
      detail: `Poin loyalitas ditukarkan: -${points} poin`,
      metadata: { customerId, pointsRedeemed: points },
    }).catch(() => {});
  }

  revalidatePath("/pelanggan");
}

// Default tier thresholds (based on totalSpent in Rupiah) used when no settings configured
const DEFAULT_TIER_THRESHOLDS: { name: string; minSpent: number }[] = [
  { name: "Platinum", minSpent: 10000000 },
  { name: "Gold", minSpent: 5000000 },
  { name: "Silver", minSpent: 2000000 },
  { name: "Bronze", minSpent: 0 },
];

async function getTierThresholds(): Promise<{ name: string; minSpent: number }[]> {
  try {
    const setting = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.key, "memberTiers"))
      .limit(1);

    const raw = setting[0]?.value;
    const tiers = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : null;

    if (tiers && tiers.length > 0) {
      // Map minPoints to minSpent threshold — sorted descending so highest tier is checked first
      return tiers
        .map((t: { name: string; minPoints: number }) => ({
          name: t.name,
          minSpent: (t.minPoints ?? 0) * 1000, // 1 point = Rp1.000 spent
        }))
        .sort((a: { minSpent: number }, b: { minSpent: number }) => b.minSpent - a.minSpent);
    }
  } catch {
    // fallback to defaults
  }
  return DEFAULT_TIER_THRESHOLDS;
}

export async function recalculateTier(customerId: string) {
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer[0]) return;

  const spent = customer[0].totalSpent;
  const thresholds = await getTierThresholds();

  // Find the highest tier the customer qualifies for
  let tier: "Bronze" | "Silver" | "Gold" | "Platinum" = "Bronze";
  for (const t of thresholds) {
    if (spent >= t.minSpent) {
      tier = t.name as typeof tier;
      break;
    }
  }

  if (tier !== customer[0].tier) {
    const user = await getCurrentUser();
    if (user) {
      createAuditLog({
        userId: user.id,
        userName: user.name || "Unknown",
        action: "pelanggan",
        detail: `Tier pelanggan berubah: ${customer[0].tier} → ${tier}`,
        metadata: { customerId, oldTier: customer[0].tier, newTier: tier },
      }).catch(() => {});
    }
  }

  await db.update(customers).set({ tier }).where(eq(customers.id, customerId));
}

export async function getCustomerStats() {
  const allCustomers = await db.select().from(customers);
  const thisMonth = new Date().toISOString().slice(0, 7);

  return {
    total: allCustomers.length,
    newThisMonth: allCustomers.filter((c) => c.joinDate.startsWith(thisMonth)).length,
    totalPoints: allCustomers.reduce((sum, c) => sum + c.points, 0),
    totalSpent: allCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
  };
}
