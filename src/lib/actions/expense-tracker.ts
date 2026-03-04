"use server";

import { db } from "@/db";
import { expenseCategories, recurringExpenses, financialTransactions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/actions/auth-helpers";

// ═══════════════════════════════════════════════════════════
// Expense Categories
// ═══════════════════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
    { name: "Penjualan", type: "masuk" as const, isDefault: true },
    { name: "Pembelian Stok", type: "keluar" as const, isDefault: true },
    { name: "Gaji", type: "keluar" as const, isDefault: true },
    { name: "Sewa", type: "keluar" as const, isDefault: true },
    { name: "Utilitas", type: "keluar" as const, isDefault: true },
    { name: "Lainnya", type: "keluar" as const, isDefault: true },
];

export async function getExpenseCategories() {
    const categories = await db
        .select()
        .from(expenseCategories)
        .orderBy(expenseCategories.name);

    // If no categories exist yet, seed defaults
    if (categories.length === 0) {
        await db.insert(expenseCategories).values(DEFAULT_CATEGORIES);
        return db.select().from(expenseCategories).orderBy(expenseCategories.name);
    }

    return categories;
}

export async function createExpenseCategory(data: {
    name: string;
    type: "masuk" | "keluar";
}) {
    await requireRole("manager", "owner");
    await db.insert(expenseCategories).values({
        name: data.name,
        type: data.type,
        isDefault: false,
    });
    revalidatePath("/keuangan");
    revalidatePath("/laporan");
}

export async function deleteExpenseCategory(id: string) {
    await requireRole("manager", "owner");
    // Don't allow deleting default categories
    const cat = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    if (cat[0]?.isDefault) {
        throw new Error("Tidak bisa menghapus kategori bawaan");
    }
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    revalidatePath("/keuangan");
    revalidatePath("/laporan");
}

// ═══════════════════════════════════════════════════════════
// Recurring Expenses
// ═══════════════════════════════════════════════════════════

export async function getRecurringExpenses() {
    return db
        .select()
        .from(recurringExpenses)
        .where(eq(recurringExpenses.isActive, true))
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
    const user = await getCurrentUser();

    await db.insert(recurringExpenses).values({
        description: data.description,
        category: data.category,
        amount: data.amount,
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
        createdBy: user?.id || null,
    });

    revalidatePath("/keuangan");
}

export async function deleteRecurringExpense(id: string) {
    await requireRole("manager", "owner");
    await db
        .update(recurringExpenses)
        .set({ isActive: false })
        .where(eq(recurringExpenses.id, id));
    revalidatePath("/keuangan");
}

/**
 * Process due recurring expenses — creates transactions for all overdue items
 * and advances their nextDueDate. Call this on page load or via cron.
 */
export async function processRecurringExpenses() {
    const today = new Date().toISOString().split("T")[0];
    const user = await getCurrentUser();

    const dueExpenses = await db
        .select()
        .from(recurringExpenses)
        .where(
            and(
                eq(recurringExpenses.isActive, true),
            )
        );

    let processed = 0;

    for (const expense of dueExpenses) {
        // Process all overdue dates
        let nextDue = expense.nextDueDate;
        while (nextDue <= today) {
            // Create the transaction
            await db.insert(financialTransactions).values({
                date: nextDue,
                type: "keluar",
                category: expense.category,
                description: `[Otomatis] ${expense.description}`,
                amount: expense.amount,
                createdBy: user?.id || expense.createdBy || null,
            });

            // Advance to next due date
            nextDue = advanceDate(nextDue, expense.frequency);
            processed++;
        }

        // Update the next due date
        await db
            .update(recurringExpenses)
            .set({ nextDueDate: nextDue })
            .where(eq(recurringExpenses.id, expense.id));
    }

    if (processed > 0) {
        revalidatePath("/keuangan");
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
