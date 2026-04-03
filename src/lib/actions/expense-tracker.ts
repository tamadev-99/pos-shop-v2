"use server";

import { db } from "@/db";
import { expenseCategories, recurringExpenses, financialTransactions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createAuditLog } from "@/lib/actions/audit";
import { getActiveStoreId, getStoreContext, getRequiredStoreId, getRequiredStoreContext } from "@/lib/actions/store-context";

const DEFAULT_CATEGORIES = [
    { name: "Penjualan", type: "masuk" as const, isDefault: true },
    { name: "Pembelian Stok", type: "keluar" as const, isDefault: true },
    { name: "Gaji", type: "keluar" as const, isDefault: true },
    { name: "Sewa", type: "keluar" as const, isDefault: true },
    { name: "Utilitas", type: "keluar" as const, isDefault: true },
    { name: "Lainnya", type: "keluar" as const, isDefault: true },
];

export async function getExpenseCategories() {
    const storeId = await getActiveStoreId();
    if (!storeId) return [];

    const cats = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.storeId, storeId))
        .orderBy(expenseCategories.name);

    if (cats.length === 0) {
        await db.insert(expenseCategories).values(
            DEFAULT_CATEGORIES.map((c) => ({ ...c, storeId }))
        );
        return db
            .select()
            .from(expenseCategories)
            .where(eq(expenseCategories.storeId, storeId))
            .orderBy(expenseCategories.name);
    }

    return cats;
}

export async function createExpenseCategory(data: {
    name: string;
    type: "masuk" | "keluar";
}) {
    await requireRole("manager", "owner");
    const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

    await db.insert(expenseCategories).values({
        name: data.name,
        type: data.type,
        isDefault: false,
        storeId,
    });

    createAuditLog({
        userName,
        action: "keuangan",
        detail: `Kategori pengeluaran dibuat: ${data.name}`,
        metadata: { name: data.name, type: data.type },
        storeId,
        employeeProfileId,
    }).catch(() => {});

    revalidatePath("/laporan");
}

export async function deleteExpenseCategory(id: string) {
    await requireRole("manager", "owner");
    const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

    const cat = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    if (cat[0]?.isDefault) {
        throw new Error("Tidak bisa menghapus kategori bawaan");
    }
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));

    createAuditLog({
        userName,
        action: "keuangan",
        detail: `Kategori pengeluaran dihapus: ${cat[0]?.name || id}`,
        metadata: { categoryId: id, name: cat[0]?.name },
        storeId,
        employeeProfileId,
    }).catch(() => {});

    revalidatePath("/laporan");
}

export async function getRecurringExpenses() {
    const storeId = await getActiveStoreId();
    if (!storeId) return [];

    return db
        .select()
        .from(recurringExpenses)
        .where(and(eq(recurringExpenses.isActive, true), eq(recurringExpenses.storeId, storeId)))
        .orderBy(recurringExpenses.nextDueDate);
}

export async function createRecurringExpense(data: {
    description: string;
    category: string;
    amount: number;
    frequency: "harian" | "mingguan" | "bulanan" | "tahunan";
    nextDueDate: string;
}) {
    await requireRole("manager", "owner");
    const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

    await db.insert(recurringExpenses).values({
        description: data.description,
        category: data.category,
        amount: data.amount,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
        employeeProfileId,
        storeId,
    });

    createAuditLog({
        userName,
        action: "keuangan",
        detail: `Pengeluaran rutin dibuat: ${data.description} (${data.frequency})`,
        metadata: { description: data.description, amount: data.amount, frequency: data.frequency },
        storeId,
        employeeProfileId,
    }).catch(() => {});

    revalidatePath("/laporan");
}

export async function deleteRecurringExpense(id: string) {
    await requireRole("manager", "owner");
    const { storeId, employeeProfileId, userName } = await getRequiredStoreContext();

    await db
        .update(recurringExpenses)
        .set({ isActive: false })
        .where(eq(recurringExpenses.id, id));

    createAuditLog({
        userName,
        action: "keuangan",
        detail: `Pengeluaran rutin dihapus`,
        metadata: { recurringExpenseId: id },
        storeId,
        employeeProfileId,
    }).catch(() => {});

    revalidatePath("/laporan");
}

export async function processRecurringExpenses() {
    const storeId = await getActiveStoreId();
    if (!storeId) return 0;
    const today = new Date().toISOString().split("T")[0];

    const dueExpenses = await db
        .select()
        .from(recurringExpenses)
        .where(
            and(
                eq(recurringExpenses.isActive, true),
                eq(recurringExpenses.storeId, storeId),
            )
        );

    let processed = 0;

    for (const expense of dueExpenses) {
        let nextDue = expense.nextDueDate;
        while (nextDue <= today) {
            await db.insert(financialTransactions).values({
                date: nextDue,
                type: "keluar",
                category: expense.category,
                description: `[Otomatis] ${expense.description}`,
                amount: expense.amount,
                employeeProfileId: expense.employeeProfileId,
                storeId,
            });

            nextDue = advanceDate(nextDue, expense.frequency);
            processed++;
        }

        await db
            .update(recurringExpenses)
            .set({ nextDueDate: nextDue })
            .where(eq(recurringExpenses.id, expense.id));
    }

    if (processed > 0) {
        revalidatePath("/laporan");
    }

    return processed;
}

function advanceDate(
    dateStr: string,
    frequency: "harian" | "mingguan" | "bulanan" | "tahunan"
): string {
    const d = new Date(dateStr);
    switch (frequency) {
        case "harian":
            d.setDate(d.getDate() + 1);
            break;
        case "mingguan":
            d.setDate(d.getDate() + 7);
            break;
        case "bulanan":
            d.setMonth(d.getMonth() + 1);
            break;
        case "tahunan":
            d.setFullYear(d.getFullYear() + 1);
            break;
    }
    return d.toISOString().split("T")[0];
}
