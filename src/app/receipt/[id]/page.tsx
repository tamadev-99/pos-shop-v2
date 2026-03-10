import { getOrderById } from "@/lib/actions/orders";
import { getSetting } from "@/lib/actions/settings";
import { notFound } from "next/navigation";
import { ReceiptClient } from "./receipt-client";


export default async function DynamicReceiptPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
        return notFound();
    }

    // Fetch store settings for the receipt header/footer
    const [storeName, receiptAddress, storePhone, receiptFooter, taxName] = await Promise.all([
        getSetting("storeName"),
        getSetting("receiptAddress"),
        getSetting("storePhone"),
        getSetting("receiptFooter"),
        getSetting("taxName"),
    ]);

    return (
        <ReceiptClient
            order={{
                id: order.id,
                createdAt: order.createdAt,
                cashierId: order.cashierId ?? null,
                customerName: order.customerName ?? null,
                items: order.items,
                subtotal: order.subtotal,
                discountAmount: order.discountAmount,
                shippingFee: order.shippingFee,
                taxAmount: order.taxAmount,
                total: order.total,
                paymentMethod: order.paymentMethod,
                cashPaid: order.cashPaid ?? null,
                changeAmount: order.changeAmount ?? null,
                bankName: order.bankName ?? null,
                referenceNumber: order.referenceNumber ?? null,
                notes: order.notes ?? null,
            }}
            store={{
                name: (storeName as string) || "KasirPro",
                address: (receiptAddress as string) || "",
                phone: (storePhone as string) || "",
                footer: (receiptFooter as string) || "Terima kasih atas kunjungan Anda!",
                taxName: (taxName as string) || "PPN",
            }}
        />
    );
}
