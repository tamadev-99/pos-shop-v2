"use server";

import { db } from "@/db";
import { suppliers, supplierCategories } from "@/db/schema";
import { eq, like, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getCurrentUser } from "@/lib/actions/auth-helpers";

export async function getSuppliers(filters?: { search?: string; status?: string }) {
  const conditions = [];
  if (filters?.search) {
    conditions.push(like(suppliers.name, `%${filters.search}%`));
  }
  if (filters?.status) {
    conditions.push(eq(suppliers.status, filters.status as "aktif" | "nonaktif"));
  }

  const result = await db
    .select()
    .from(suppliers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(suppliers.createdAt));

  // Get categories for each supplier
  const suppliersWithCategories = await Promise.all(
    result.map(async (supplier) => {
      const cats = await db.query.supplierCategories.findMany({
        where: eq(supplierCategories.supplierId, supplier.id),
        with: { category: true },
      });
      return {
        ...supplier,
        categories: cats.map((c) => c.category?.name || "Kategori Dihapus").filter(Boolean),
      };
    })
  );

  return suppliersWithCategories;
}

export async function getSupplierById(id: string) {
  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, id),
  });

  if (!supplier) return null;

  const cats = await db.query.supplierCategories.findMany({
    where: eq(supplierCategories.supplierId, id),
    with: { category: true },
  });

  return {
    ...supplier,
    categories: cats.map((c) => c.category?.name || "Kategori Dihapus").filter(Boolean),
  };
}

export async function createSupplier(data: {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  categoryIds?: string[];
}) {
  const id = crypto.randomUUID();
  const today = new Date().toISOString().split("T")[0];

  await db.insert(suppliers).values({
    id,
    name: data.name,
    contactPerson: data.contactPerson,
    phone: data.phone,
    email: data.email || "",
    address: data.address || "",
    joinDate: today,
  });

  if (data.categoryIds && data.categoryIds.length > 0) {
    await db.insert(supplierCategories).values(
      data.categoryIds.map((catId) => ({
        supplierId: id,
        categoryId: catId,
      }))
    );
  }

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "supplier",
      detail: `Supplier baru ditambahkan: ${data.name}`,
      metadata: { supplierId: id, name: data.name },
    }).catch(() => {});
  }

  revalidatePath("/supplier");
  return id;
}

export async function updateSupplier(
  id: string,
  data: Partial<{
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    status: "aktif" | "nonaktif";
  }>
) {
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));

  const user = await getCurrentUser();
  if (user) {
    createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "supplier",
      detail: `Data supplier diperbarui`,
      metadata: { supplierId: id, changes: data },
    }).catch(() => {});
  }

  revalidatePath("/supplier");
}
