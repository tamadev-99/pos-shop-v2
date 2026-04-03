"use server";

import { db } from "@/db";
import { customers, storeSettings } from "@/db/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext, getRequiredStoreId, getRequiredStoreContext } from "@/lib/actions/store-context";

export async function getCustomers(filters?: { search?: string; tier?: string }) {
  const storeId = await getActiveStoreId();
  const conditions = storeId ? [eq(customers.storeId, storeId)] : [];

  if (filters?.search) {
    conditions.push(like(customers.name, `%${filters.search}%`));
  }
  if (filters?.tier) {
    conditions.push(eq(customers.tier, filters.tier as "Bronze" | "Silver" | "Gold" | "Platinum"));
  }

  return db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: string) {
  const storeId = await getActiveStoreId();
  return db.query.customers.findFirst({
    where: and(eq(customers.id, id), storeId ? eq(customers.storeId, storeId) : undefined),
  });
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  birthDate?: string;
}) {
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();
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
    storeId,
  });

  createAuditLog({
    userName,
    action: "pelanggan",
    detail: `Pelanggan baru ditambahkan: ${data.name}`,
    metadata: { customerId: id, name: data.name, phone: data.phone },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/kontak");
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
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();
  await db
    .update(customers)
    .set(data)
    .where(and(eq(customers.id, id), eq(customers.storeId, storeId)));

  createAuditLog({
    userName,
    action: "pelanggan",
    detail: `Data pelanggan diperbarui`,
    metadata: { customerId: id, changes: data },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/kontak");
}

export async function addLoyaltyPoints(customerId: string, points: number) {
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  await db
    .update(customers)
    .set({
      points: sql`${customers.points} + ${points}`,
    })
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)));

  createAuditLog({
    userName,
    action: "pelanggan",
    detail: `Poin loyalitas ditambahkan: +${points} poin`,
    metadata: { customerId, pointsAdded: points },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  await recalculateTier(customerId);
  revalidatePath("/kontak");
}

export async function redeemPoints(customerId: string, points: number) {
  const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

  await db
    .update(customers)
    .set({
      points: sql`${customers.points} - ${points}`,
    })
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)));

  createAuditLog({
    userName,
    action: "pelanggan",
    detail: `Poin loyalitas ditukarkan: -${points} poin`,
    metadata: { customerId, pointsRedeemed: points },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/kontak");
}

const DEFAULT_TIER_THRESHOLDS: { name: string; minSpent: number }[] = [
  { name: "Platinum", minSpent: 10000000 },
  { name: "Gold", minSpent: 5000000 },
  { name: "Silver", minSpent: 2000000 },
  { name: "Bronze", minSpent: 0 },
];

async function getTierThresholds(storeId: string): Promise<{ name: string; minSpent: number }[]> {
  try {
    const setting = await db
      .select()
      .from(storeSettings)
      .where(and(eq(storeSettings.storeId, storeId), eq(storeSettings.key, "memberTiers")))
      .limit(1);

    const raw = setting[0]?.value;
    const tiers = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : null;

    if (tiers && tiers.length > 0) {
      return tiers
        .map((t: { name: string; minPoints: number }) => ({
          name: t.name,
          minSpent: (t.minPoints ?? 0) * 1000,
        }))
        .sort((a: { minSpent: number }, b: { minSpent: number }) => b.minSpent - a.minSpent);
    }
  } catch {
    // fallback
  }
  return DEFAULT_TIER_THRESHOLDS;
}

export async function recalculateTier(customerId: string) {
  const storeId = await getRequiredStoreId();
  const customer = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)))
    .limit(1);

  if (!customer[0]) return;

  const spent = customer[0].totalSpent;
  const thresholds = await getTierThresholds(storeId);

  let tier: "Bronze" | "Silver" | "Gold" | "Platinum" = "Bronze";
  for (const t of thresholds) {
    if (spent >= t.minSpent) {
      tier = t.name as typeof tier;
      break;
    }
  }

  await db.update(customers).set({ tier }).where(eq(customers.id, customerId));
}

export async function getCustomerStats() {
  const storeId = await getActiveStoreId();
  const conditions = storeId ? [eq(customers.storeId, storeId)] : [];
  
  const allCustomers = await db
    .select()
    .from(customers)
    .where(and(...conditions));
  const thisMonth = new Date().toISOString().slice(0, 7);

  return {
    total: allCustomers.length,
    newThisMonth: allCustomers.filter((c) => c.joinDate.startsWith(thisMonth)).length,
    totalPoints: allCustomers.reduce((sum, c) => sum + c.points, 0),
    totalSpent: allCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
  };
}
