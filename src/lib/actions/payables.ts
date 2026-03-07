"use server";

import { db } from "@/db";
import { purchaseOrders, purchaseOrderTimeline, financialTransactions } from "@/db/schema";
import { eq, ne, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPayables() {
    const list = await db.query.purchaseOrders.findMany({
        where: ne(purchaseOrders.paymentStatus, "lunas"),
        with: {
            supplier: true,
        },
        orderBy: [purchaseOrders.dueDate, desc(purchaseOrders.createdAt)],
    });
    return list;
}

export async function getPayablesSummary() {
    const payables = await getPayables();
    let totalHutang = 0;
    let overdueCount = 0;

    const today = new Date().toISOString().split("T")[0];

    for (const po of payables) {
        const sisa = po.total - po.paidAmount;
        totalHutang += sisa;
        if (po.dueDate && po.dueDate < today) {
            overdueCount++;
        }
    }

    return { totalHutang, count: payables.length, overdueCount };
}

export async function recordPayment(poId: string, amount: number, note?: string) {
    const po = await db.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, poId),
    });

    if (!po) throw new Error("PO tidak ditemukan");

    const newPaidAmount = po.paidAmount + amount;
    const newStatus = newPaidAmount >= po.total ? "lunas" : "sebagian";

    const today = new Date().toISOString().split("T")[0];

    await db.update(purchaseOrders)
        .set({
            paidAmount: newPaidAmount,
            paymentStatus: newStatus as "sebagian" | "lunas",
        })
        .where(eq(purchaseOrders.id, poId));

    await db.insert(purchaseOrderTimeline).values({
        purchaseOrderId: poId,
        status: "Pembayaran",
        note: note || `Pembayaran sebesar Rp ${amount.toLocaleString()}`,
        date: today,
    });

    // Record in financial transactions as money out
    await db.insert(financialTransactions).values({
        date: today,
        type: "keluar",
        category: "Pembayaran Hutang",
        description: `Pembelian PO ${poId}`,
        amount: amount,
        orderId: poId, // reuse orderId for PO id reference
    });

    revalidatePath("/laporan");
    revalidatePath("/pembelian");
    revalidatePath("/keuangan");

    return { success: true };
}
