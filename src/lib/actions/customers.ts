"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  revalidatePath("/pelanggan");
}

export async function addLoyaltyPoints(customerId: string, points: number) {
  await db
    .update(customers)
    .set({
      points: sql`${customers.points} + ${points}`,
    })
    .where(eq(customers.id, customerId));

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

  revalidatePath("/pelanggan");
}

export async function recalculateTier(customerId: string) {
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer[0]) return;

  const spent = customer[0].totalSpent;
  let tier: "Bronze" | "Silver" | "Gold" | "Platinum" = "Bronze";

  if (spent >= 10000000) tier = "Platinum";
  else if (spent >= 5000000) tier = "Gold";
  else if (spent >= 2000000) tier = "Silver";

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
