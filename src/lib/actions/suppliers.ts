"use server";

import { db } from "@/db";
import { suppliers, supplierCategories } from "@/db/schema";
import { eq, like, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext } from "@/lib/actions/store-context";

export async function getSuppliers(filters?: { search?: string; status?: string }) {
  const storeId = await getActiveStoreId();
  const conditions = [eq(suppliers.storeId, storeId)];

  if (filters?.search) {
    conditions.push(like(suppliers.name, `%${filters.search}%`));
  }
  if (filters?.status) {
    conditions.push(eq(suppliers.status, filters.status as "aktif" | "nonaktif"));
  }

  const result = await db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(desc(suppliers.createdAt));

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
  const storeId = await getActiveStoreId();
  const supplier = await db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, id), eq(suppliers.storeId, storeId)),
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
  const { storeId, employeeProfileId, userName } = await getStoreContext();
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
    storeId,
  });

  if (data.categoryIds && data.categoryIds.length > 0) {
    await db.insert(supplierCategories).values(
      data.categoryIds.map((catId) => ({
        supplierId: id,
        categoryId: catId,
      }))
    );
  }

  createAuditLog({
    userName,
    action: "supplier",
    detail: `Supplier baru ditambahkan: ${data.name}`,
    metadata: { supplierId: id, name: data.name },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/kontak");
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
  const { storeId, employeeProfileId, userName } = await getStoreContext();
  await db
    .update(suppliers)
    .set(data)
    .where(and(eq(suppliers.id, id), eq(suppliers.storeId, storeId)));

  createAuditLog({
    userName,
    action: "supplier",
    detail: `Data supplier diperbarui`,
    metadata: { supplierId: id, changes: data },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/kontak");
}
