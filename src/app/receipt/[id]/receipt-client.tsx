"use client";

import { formatRupiah } from "@/lib/utils";
import { CheckCircle2, Printer, Download, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
    productName: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
}

interface Order {
    id: string;
    createdAt: Date;
    cashierId: string | null;
    customerName: string | null;
    items: OrderItem[];
    subtotal: number;
    discountAmount: number;
    shippingFee: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    cashPaid?: number | null;
    changeAmount?: number | null;
    bankName?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
}

interface ReceiptClientProps {
    order: Order;
    store: {
        name: string;
        address: string;
        phone: string;
        footer: string;
        taxName: string;
    };
}

export function ReceiptClient({ order, store }: ReceiptClientProps) {
    const dateObj = new Date(order.createdAt);
    const formattedDate = dateObj.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    const formattedTime = dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-12 flex flex-col items-center justify-start print:p-0 print:bg-white">
            {/* Hide controls when printing */}
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3 mb-6 print:hidden animate-fade-down">
                <Button onClick={handlePrint} className="w-full sm:flex-1 h-12" variant="default">
                    <Download className="mr-2" size={18} />
                    Simpan PDF
                </Button>
            </div>

            {/* The Printable Receipt Box */}
            <div className="w-full max-w-md bg-surface border border-border sm:border-border/50 rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none animate-fade-up">
                {/* Header */}
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-6 md:p-8 flex flex-col items-center border-b border-border/50">
                    <div className="w-14 h-14 bg-background rounded-2xl border border-border flex items-center justify-center shadow-sm mb-4">
                        <Store size={26} className="text-accent" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground font-[family-name:var(--font-display)]">
                        {store.name}
                    </h1>
                    {store.address && (
                        <p className="text-sm text-muted-foreground text-center mt-1.5 px-4 leading-relaxed">
                            {store.address}
                        </p>
                    )}
                    {store.phone && (
                        <p className="text-sm text-muted-dim text-center mt-1">
                            Telp: {store.phone}
                        </p>
                    )}
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    {/* Order Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-background border border-border/50 rounded-xl p-4">
                        <div>
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1">No. Order</p>
                            <p className="font-semibold text-foreground">{order.id}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1">Tanggal</p>
                            <p className="font-medium text-foreground">{formattedDate}</p>
                            <p className="text-muted-dim text-xs">{formattedTime}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1">Kasir</p>
                            <p className="font-medium text-foreground">{order.cashierId || "Admin"}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wider mb-1">Pelanggan</p>
                            <p className="font-medium text-foreground">{order.customerName}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
                            Daftar Barang
                        </h3>
                        <div className="space-y-3">
                            {order.items.map((item, idx: number) => (
                                <div key={idx} className="flex justify-between items-start group">
                                    <div className="pr-4">
                                        <p className="font-medium text-sm text-foreground leading-tight group-hover:text-accent transition-colors">
                                            {item.productName}
                                        </p>
                                        <p className="text-xs text-muted-dim mt-0.5">
                                            {item.qty} x {formatRupiah(item.unitPrice)}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-sm text-foreground whitespace-nowrap">
                                        {formatRupiah(item.subtotal)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-border pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatRupiah(order.subtotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-accent">
                                <span>Diskon</span>
                                <span>-{formatRupiah(order.discountAmount)}</span>
                            </div>
                        )}
                        {order.shippingFee > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Ongkos Kirim</span>
                                <span>{formatRupiah(order.shippingFee)}</span>
                            </div>
                        )}
                        {order.taxAmount > 0 && (
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{store.taxName} (Termasuk)</span>
                                <span>{formatRupiah(order.taxAmount)}</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-end">
                            <span className="text-base font-medium text-foreground">Total Tagihan</span>
                            <span className="text-2xl font-bold text-foreground font-num">
                                {formatRupiah(order.total)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-background border border-border/50 rounded-xl p-4 mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Metode Pembayaran</span>
                            <span className="font-medium capitalize text-foreground">{order.paymentMethod}</span>
                        </div>
                        {order.bankName && (
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-muted-foreground">
                                    {order.paymentMethod === "ewallet" ? "E-Wallet" : "Bank"}
                                </span>
                                <span className="font-medium text-foreground">{order.bankName}</span>
                            </div>
                        )}
                        {order.referenceNumber && (
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-muted-foreground">Ref</span>
                                <span className="font-medium text-foreground font-num">****{order.referenceNumber}</span>
                            </div>
                        )}
                        {order.paymentMethod === "tunai" && order.cashPaid && (
                            <>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-muted-foreground">Tunai</span>
                                    <span className="font-medium text-foreground">{formatRupiah(order.cashPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Kembali</span>
                                    <span className="font-medium text-success">{formatRupiah(order.changeAmount || 0)}</span>
                                </div>
                            </>
                        )}
                        {order.notes && (
                            <p className="text-xs text-muted-foreground italic mt-2">{order.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50 justify-center">
                            <CheckCircle2 size={16} className="text-success" />
                            <span className="text-xs font-medium text-success">Lunas</span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-dim italic px-8">
                        {store.footer}
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .animate-fade-down, .animate-fade-up {
            animation: none !important;
          }
          * {
            box-shadow: none !important;
            border-color: #e5e7eb !important;
          }
          .text-muted-foreground, .text-muted-dim {
            color: #6b7280 !important;
          }
          .text-foreground {
            color: #111827 !important;
          }
          .text-accent, .text-success {
            color: #000000 !important;
          }
          img, svg {
            color: #000000 !important;
            fill: currentcolor !important;
          }
          .bg-surface, .bg-background {
            background-color: white !important;
          }
          .bg-gradient-to-br {
            background: white !important;
            border-bottom: 2px solid #000;
          }
        }
      `}} />
        </div>
    );
}
