"use server";

import { db } from "@/db";
import { purchaseOrders, purchaseOrderTimeline, financialTransactions } from "@/db/schema";
import { eq, ne, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActiveStoreId, getStoreContext, getRequiredStoreContext } from "@/lib/actions/store-context";

export async function getPayables() {
    const storeId = await getActiveStoreId();
    const conditions = storeId ? [eq(purchaseOrders.storeId, storeId)] : [];
    
    const list = await db.query.purchaseOrders.findMany({
        where: and(ne(purchaseOrders.paymentStatus, "lunas"), ...conditions),
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
    const { storeId, employeeProfileId } = await getRequiredStoreContext();

    const po = await db.query.purchaseOrders.findFirst({
        where: and(eq(purchaseOrders.id, poId), storeId ? eq(purchaseOrders.storeId, storeId) : undefined),
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
        storeId,
    });

    await db.insert(financialTransactions).values({
        date: today,
        type: "keluar",
        category: "Pembayaran Hutang",
        description: `Pembelian PO ${poId}`,
        amount: amount,
        orderId: poId,
        storeId,
        employeeProfileId: employeeProfileId || null,
    });

    revalidatePath("/laporan");
    revalidatePath("/pembelian");

    return { success: true };
}
