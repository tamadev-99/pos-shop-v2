"use client";

import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { Printer, X, CheckCircle2, MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { buildReceiptCommands, printReceipt, printViaBrowser, type PrinterConfig, type ReceiptPrintData } from "@/lib/thermal-printer";
import { toast } from "sonner";

interface ReceiptItem {
    name: string;
    variantInfo: string;
    qty: number;
    price: number;
}

interface ReceiptDialogProps {
    open: boolean;
    onClose: () => void;
    orderId: string;
    items: ReceiptItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingFee: number;
    total: number;
    paymentMethod: string;
    customerName: string;
    customerPhone?: string;
    cashierName: string;
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    receiptHeader?: string;
    receiptFooter?: string;
    printerType?: string;
    printerTarget?: string;
    receiptWidth?: "58" | "80";
    cashPaid?: number;
    changeAmount?: number;
    taxName?: string;
}

const PAYMENT_LABELS: Record<string, string> = {
    tunai: "Tunai",
    debit: "Debit",
    kredit: "Kartu Kredit",
    transfer: "Transfer Bank",
    qris: "QRIS",
    ewallet: "E-Wallet",
};

export function ReceiptDialog({
    open,
    onClose,
    orderId,
    items,
    subtotal,
    discountAmount,
    taxAmount,
    shippingFee,
    total,
    paymentMethod,
    customerName,
    customerPhone,
    cashierName,
    storeName = "KasirPro",
    storeAddress,
    storePhone,
    receiptHeader,
    receiptFooter,
    printerType = "browser",
    printerTarget = "",
    receiptWidth = "58",
    cashPaid,
    changeAmount,
    taxName = "PPN",
}: ReceiptDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const now = new Date();

    const handlePrint = async () => {
        const receiptData: ReceiptPrintData = {
            orderId,
            items: items.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price
            })),
            customerName,
            subtotal,
            discountAmount,
            tax: taxAmount,
            shippingFee,
            total,
            paymentMethod,
            storeName,
            storeAddress: storeAddress || "",
            storePhone: storePhone || "",
            receiptHeader: receiptHeader || storeName,
            receiptFooter: receiptFooter || "Terima kasih atas kunjungan Anda!",
            cashPaid,
            changeAmount,
        };

        if (printerType === "browser" || !printerType) {
            printViaBrowser(receiptData, receiptWidth);
            return;
        }

        try {
            const commands = buildReceiptCommands(receiptData, receiptWidth);
            const config: PrinterConfig = {
                type: printerType as "usb" | "bluetooth" | "network",
                target: printerTarget,
                paperWidth: receiptWidth
            };
            await printReceipt(commands, config);
            toast.success("Struk berhasil dicetak!");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Gagal mencetak struk";
            toast.error(message);
            // Fallback to browser
            printViaBrowser(receiptData, receiptWidth);
        }
    };

    const handleWhatsApp = () => {
        let text = `*Struk Pembelian*\n*${storeName}*\n`;
        if (storeAddress) text += `${storeAddress}\n`;
        text += `--------------------------------\n`;
        text += `No. Order: ${orderId}\n`;
        text += `Tanggal: ${now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })} ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}\n`;
        text += `Pelanggan: ${customerName}\n`;
        text += `--------------------------------\n`;

        items.forEach(item => {
            text += `${item.name}\n`;
            text += `${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.qty * item.price)}\n`;
        });

        text += `--------------------------------\n`;
        text += `Subtotal: ${formatRupiah(subtotal)}\n`;
        if (discountAmount > 0) text += `Diskon: -${formatRupiah(discountAmount)}\n`;
        if (taxAmount > 0) text += `${taxName}: ${formatRupiah(taxAmount)}\n`;
        if (shippingFee > 0) text += `Ongkir: ${formatRupiah(shippingFee)}\n`;
        text += `*TOTAL: ${formatRupiah(total)}*\n`;
        text += `Pembayaran: ${paymentMethod}\n`;

        if (cashPaid !== undefined && changeAmount !== undefined) {
            text += `Uang Tunai: ${formatRupiah(cashPaid)}\n`;
            text += `Kembalian: ${formatRupiah(changeAmount)}\n`;
        }

        text += `--------------------------------\n`;
        text += `${receiptFooter || "Terima kasih atas kunjungan Anda!"}\n`;
        text += `Powered by KasirPro`;

        const encodedText = encodeURIComponent(text);

        let waLink = `https://wa.me/?text=${encodedText}`;
        if (customerPhone) {
            // Remove non-digit chars and ensure starting with country code. Assuming ID (62) for local standard if starts with 0.
            let formattedPhone = customerPhone.replace(/\D/g, '');
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '62' + formattedPhone.substring(1);
            }
            waLink = `https://wa.me/${formattedPhone}?text=${encodedText}`;
        }

        window.open(waLink, "_blank");
    };

    return (
        <Dialog open={open} onClose={onClose} className="max-w-sm">
            <DialogClose onClose={onClose} />
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-accent" />
                    Transaksi Berhasil
                </DialogTitle>
            </DialogHeader>

            {/* Printable receipt content */}
            <div ref={receiptRef}>
                <div className="bg-surface border border-border rounded-xl p-4 text-xs font-mono space-y-2">
                    {/* Header */}
                    <div className="text-center space-y-0.5">
                        <p className="font-bold text-sm text-foreground">{storeName}</p>
                        {storeAddress && <p className="text-muted-foreground">{storeAddress}</p>}
                        {storePhone && <p className="text-muted-foreground">Telp: {storePhone}</p>}
                    </div>

                    <div className="border-b border-dashed border-border my-2" />

                    {/* Order info */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">No. Order</span>
                            <span className="font-bold text-foreground">{orderId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tanggal</span>
                            <span className="text-foreground">
                                {now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Jam</span>
                            <span className="text-foreground">
                                {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Kasir</span>
                            <span className="text-foreground">{cashierName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pelanggan</span>
                            <span className="text-foreground">{customerName}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-border my-2" />

                    {/* Items */}
                    <div className="space-y-1.5">
                        {items.map((item, i) => (
                            <div key={i}>
                                <p className="font-bold text-foreground">{item.name}</p>
                                <div className="flex justify-between pl-2 text-muted-foreground">
                                    <span>{item.qty} x {formatRupiah(item.price)}</span>
                                    <span className="text-foreground">{formatRupiah(item.qty * item.price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-b border-dashed border-border my-2" />

                    {/* Totals */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">{formatRupiah(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-accent">
                                <span>Diskon</span>
                                <span>-{formatRupiah(discountAmount)}</span>
                            </div>
                        )}
                        {taxAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pajak</span>
                                <span className="text-foreground">{formatRupiah(taxAmount)}</span>
                            </div>
                        )}
                        {shippingFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ongkir</span>
                                <span className="text-foreground">{formatRupiah(shippingFee)}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-b border-dashed border-border my-2" />

                    {/* Grand Total */}
                    <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">TOTAL</span>
                        <span className="text-foreground">{formatRupiah(total)}</span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Pembayaran</span>
                        <span className="text-foreground">{PAYMENT_LABELS[paymentMethod] || paymentMethod}</span>
                    </div>

                    {cashPaid !== undefined && changeAmount !== undefined && (
                        <>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Uang Tunai</span>
                                <span className="text-foreground">{formatRupiah(cashPaid)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Kembalian</span>
                                <span className="text-foreground">{formatRupiah(changeAmount)}</span>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="border-b border-dashed border-border my-2" />
                    <div className="text-center space-y-0.5 text-muted-foreground">
                        <p>{receiptFooter || "Terima kasih atas kunjungan Anda!"}</p>
                        <p className="text-[10px]">Powered by KasirPro</p>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="ghost" className="flex-1" onClick={onClose}>
                    <X size={14} className="mr-2" />
                    Tutup
                </Button>
                <div className="flex gap-2 flex-1">
                    <Button variant="outline" className="flex-1 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]" onClick={handleWhatsApp}>
                        <MessageCircle size={14} className="mr-2" />
                        WhatsApp
                    </Button>
                    <Button className="flex-1" onClick={handlePrint}>
                        <Printer size={14} className="mr-2" />
                        Cetak
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
