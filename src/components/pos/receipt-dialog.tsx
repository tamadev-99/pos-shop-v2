"use client";

import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Printer, X, CheckCircle2, MessageCircle, Send, Download } from "lucide-react";
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
    receiptFooter?: string;
    printerType?: string;
    printerTarget?: string;
    receiptWidth?: "58" | "80";
    cashPaid?: number;
    changeAmount?: number;
    bankName?: string;
    referenceNumber?: string;
    notes?: string;
    taxName?: string;
    receiptLogo?: string;
    receiptLogoImage?: string;
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
    receiptFooter,
    printerType = "browser",
    printerTarget = "",
    receiptWidth = "58",
    cashPaid,
    changeAmount,
    bankName,
    referenceNumber,
    notes,
    taxName = "PPN",
    receiptLogo,
    receiptLogoImage,
}: ReceiptDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [showPhoneInput, setShowPhoneInput] = useState(false);
    const [manualPhone, setManualPhone] = useState("");
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
            receiptFooter: receiptFooter || "Terima kasih atas kunjungan Anda!",
            cashPaid,
            changeAmount,
            receiptLogo,
            receiptLogoImage,
        };

        if (printerType === "browser" || !printerType) {
            printViaBrowser(receiptData, receiptWidth);
            return;
        }

        try {
            const commands = await buildReceiptCommands(receiptData, receiptWidth);
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

    const formatPhoneForWA = (phone: string) => {
        let formatted = phone.replace(/\D/g, '');
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        }
        return formatted;
    };

    const sendWhatsApp = (phone?: string) => {
        const receiptUrl = `${window.location.origin}/receipt/${orderId}`;

        let text = `*Terima Kasih!*\n`;
        text += `Pesanan Anda di *${storeName}* telah kami terima.\n\n`;
        text += `Silakan klik link di bawah ini untuk melihat atau menyimpan Struk Digital Anda:\n`;
        text += `${receiptUrl}\n\n`;
        text += `*${storeName}*\n`;
        if (storeAddress) text += `${storeAddress}`;

        const encodedText = encodeURIComponent(text);

        if (phone) {
            const formattedPhone = formatPhoneForWA(phone);
            window.open(`https://wa.me/${formattedPhone}?text=${encodedText}`, "_blank");
        } else {
            window.open(`https://wa.me/?text=${encodedText}`, "_blank");
        }
    };

    const handleWhatsApp = () => {
        if (customerPhone) {
            sendWhatsApp(customerPhone);
        } else {
            setShowPhoneInput(true);
        }
    };

    const handleSendManualPhone = () => {
        const cleaned = manualPhone.replace(/\D/g, '');
        if (cleaned.length < 9) {
            toast.error("Nomor telepon tidak valid");
            return;
        }
        sendWhatsApp(manualPhone);
        setShowPhoneInput(false);
        setManualPhone("");
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
                        {receiptLogo === "yes" && receiptLogoImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={receiptLogoImage} alt="Logo Toko" className="max-w-[120px] max-h-[120px] mx-auto object-contain mb-2 filter grayscale" />
                        )}
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

                    {bankName && (
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">
                                {paymentMethod === "ewallet" ? "E-Wallet" : "Bank"}
                            </span>
                            <span className="text-foreground">{bankName}</span>
                        </div>
                    )}
                    {referenceNumber && (
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Ref</span>
                            <span className="text-foreground font-num">****{referenceNumber}</span>
                        </div>
                    )}

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

                    {notes && (
                        <div className="text-[10px] text-muted-foreground italic mt-1">
                            {notes}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-b border-dashed border-border my-2" />
                    <div className="text-center space-y-0.5 text-muted-foreground">
                        <p>{receiptFooter || "Terima kasih atas kunjungan Anda!"}</p>
                        <p className="text-[10px]">Powered by KasirPro</p>
                    </div>
                </div>
            </div>

            {/* Phone input for Pelanggan Umum */}
            {showPhoneInput && (
                <div className="mt-3 p-3 bg-surface border border-border rounded-xl space-y-2">
                    <p className="text-xs text-muted-foreground">Masukkan nomor WhatsApp pelanggan:</p>
                    <div className="flex gap-2">
                        <Input
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendManualPhone()}
                            className="flex-1"
                            autoFocus
                        />
                        <Button size="sm" onClick={handleSendManualPhone} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                            <Send size={14} />
                        </Button>
                    </div>
                    <button
                        onClick={() => { setShowPhoneInput(false); setManualPhone(""); }}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        Batal
                    </button>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-4 px-4">
                <Button 
                    variant="outline" 
                    className="w-full h-10 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold text-xs" 
                    onClick={() => window.open(`/receipt/${orderId}`, "_blank")}
                >
                    <Download size={14} className="mr-2" />
                    Lihat Struk Digital
                </Button>
                
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="flex-1 h-10 text-slate-500 hover:text-slate-700" onClick={onClose}>
                        <X size={14} className="mr-2" />
                        Tutup
                    </Button>
                    <div className="flex gap-2 flex-[2]">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-10 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366] font-bold" 
                            onClick={handleWhatsApp}
                        >
                            <MessageCircle size={14} className="mr-2" />
                            WA
                        </Button>
                        <Button className="flex-1 h-10 shadow-lg shadow-accent/20 font-bold" onClick={handlePrint}>
                            <Printer size={14} className="mr-2" />
                            Cetak
                        </Button>
                    </div>
                </div>
            </div>

        </Dialog>
    );
}
