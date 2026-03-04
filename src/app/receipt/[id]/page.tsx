import { getOrderById } from "@/lib/actions/orders";
import { getSetting } from "@/lib/actions/settings";
import { notFound } from "next/navigation";
import { ReceiptClient } from "./receipt-client";


export default async function DynamicReceiptPage({
    params,
}: {
    params: { id: string };
}) {
    const order = await getOrderById(params.id);

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
            order={order}
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
