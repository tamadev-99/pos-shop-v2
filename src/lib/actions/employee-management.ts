"use server";

import { db } from "@/db";
import { employeeProfiles } from "@/db/schema/profiles";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/actions/audit";
import { getStoreContext, getActiveStoreId } from "@/lib/actions/store-context";
import bcrypt from "bcryptjs";

// ── READ ──────────────────────────────────────────────

export async function getEmployeeProfiles() {
  const storeId = await getActiveStoreId();
  return db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.storeId, storeId))
    .orderBy(desc(employeeProfiles.createdAt));
}

export async function getActiveEmployeeProfiles() {
  const storeId = await getActiveStoreId();
  return db
    .select()
    .from(employeeProfiles)
    .where(
      and(
        eq(employeeProfiles.storeId, storeId),
        eq(employeeProfiles.isActive, true)
      )
    )
    .orderBy(employeeProfiles.name);
}

export async function getEmployeeProfileById(id: string) {
  const storeId = await getActiveStoreId();
  return db.query.employeeProfiles.findFirst({
    where: and(
      eq(employeeProfiles.id, id),
      eq(employeeProfiles.storeId, storeId)
    ),
  });
}

// ── CREATE ─────────────────────────────────────────────

export async function createEmployeeProfile(data: {
  name: string;
  role: string;
  pin: string;
}) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  if (!data.name || !data.pin || !data.role) {
    return { success: false, error: "Nama, role, dan PIN wajib diisi." };
  }
  if (data.pin.length !== 6 || !/^\d{6}$/.test(data.pin)) {
    return { success: false, error: "PIN harus 6 digit angka." };
  }

  const pinHash = await bcrypt.hash(data.pin, 10);

  const [newProfile] = await db
    .insert(employeeProfiles)
    .values({
      name: data.name,
      role: data.role,
      pinHash,
      storeId,
      isActive: true,
    })
    .returning();

  createAuditLog({
    userName,
    action: "sistem",
    detail: `Profil karyawan ditambahkan: ${data.name} (${data.role})`,
    metadata: { profileId: newProfile.id, name: data.name, role: data.role },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/karyawan");
  revalidatePath("/select-employee");
  return { success: true, profile: newProfile };
}

// ── UPDATE ─────────────────────────────────────────────

export async function updateEmployeeProfile(
  id: string,
  data: { name?: string; role?: string; isActive?: boolean }
) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  // Verify ownership
  const existing = await db.query.employeeProfiles.findFirst({
    where: and(eq(employeeProfiles.id, id), eq(employeeProfiles.storeId, storeId)),
  });
  if (!existing) return { success: false, error: "Profil tidak ditemukan." };

  await db
    .update(employeeProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(employeeProfiles.id, id));

  createAuditLog({
    userName,
    action: "sistem",
    detail: `Profil karyawan diubah: ${existing.name}`,
    metadata: { profileId: id, changes: data },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/karyawan");
  revalidatePath("/select-employee");
  return { success: true };
}

// ── RESET PIN ──────────────────────────────────────────

export async function resetEmployeePin(id: string, newPin: string) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
    return { success: false, error: "PIN harus 6 digit angka." };
  }

  const existing = await db.query.employeeProfiles.findFirst({
    where: and(eq(employeeProfiles.id, id), eq(employeeProfiles.storeId, storeId)),
  });
  if (!existing) return { success: false, error: "Profil tidak ditemukan." };

  const pinHash = await bcrypt.hash(newPin, 10);
  await db
    .update(employeeProfiles)
    .set({ pinHash, updatedAt: new Date() })
    .where(eq(employeeProfiles.id, id));

  createAuditLog({
    userName,
    action: "sistem",
    detail: `PIN karyawan direset: ${existing.name}`,
    metadata: { profileId: id },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/karyawan");
  return { success: true };
}

// ── DELETE ──────────────────────────────────────────────

export async function deleteEmployeeProfile(id: string) {
  const { storeId, employeeProfileId, userName } = await getStoreContext();

  const existing = await db.query.employeeProfiles.findFirst({
    where: and(eq(employeeProfiles.id, id), eq(employeeProfiles.storeId, storeId)),
  });
  if (!existing) return { success: false, error: "Profil tidak ditemukan." };

  // Prevent deleting the last owner profile
  if (existing.role === "owner") {
    const ownerCount = await db
      .select()
      .from(employeeProfiles)
      .where(
        and(
          eq(employeeProfiles.storeId, storeId),
          eq(employeeProfiles.role, "owner"),
          eq(employeeProfiles.isActive, true)
        )
      );
    if (ownerCount.length <= 1) {
      return { success: false, error: "Tidak bisa menghapus satu-satunya Owner." };
    }
  }

  await db.delete(employeeProfiles).where(eq(employeeProfiles.id, id));

  createAuditLog({
    userName,
    action: "sistem",
    detail: `Profil karyawan dihapus: ${existing.name}`,
    metadata: { profileId: id, name: existing.name },
    storeId,
    employeeProfileId,
  }).catch(() => {});

  revalidatePath("/karyawan");
  revalidatePath("/select-employee");
  return { success: true };
}
