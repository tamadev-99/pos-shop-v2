"use client";

import { formatRupiah } from "@/lib/utils";
import { Printer, X, CheckCircle2, MessageCircle, Send, Download, ExternalLink, Store } from "lucide-react";
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
    cashierName: string | null;
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
        receiptLogo?: string;
        receiptLogoImage?: string;
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
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 sm:p-6 md:p-12 flex flex-col items-center justify-start print:p-0 print:bg-white relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Hide controls when printing */}
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3 mb-8 print:hidden animate-fade-down z-10">
                <Button onClick={handlePrint} className="w-full sm:flex-1 h-12 bg-white dark:bg-slate-900 border-border/50 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm" variant="outline">
                    <Download className="mr-2 text-accent" size={18} />
                    Simpan PDF / Cetak
                </Button>
                <Button variant="default" className="w-full sm:w-auto h-12 px-6 shadow-lg shadow-accent/20" onClick={() => window.open('/', '_self')}>
                    <Store className="mr-2" size={18} />
                    Ke Toko
                </Button>
            </div>

            {/* The Printable Receipt Box */}
            <div className="w-full max-w-md bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] overflow-hidden print:shadow-none print:border-none print:rounded-none animate-fade-up z-10">
                <div className="relative">
                    {/* Top Accent Bar */}
                    <div className="h-2 w-full bg-gradient-to-r from-accent via-indigo-500 to-accent" />
                    
                    {/* Header */}
                    <div className="p-8 md:p-10 flex flex-col items-center border-b border-slate-100 dark:border-slate-800/50">
                        {store.receiptLogo === "yes" && store.receiptLogoImage ? (
                            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-md mb-6 overflow-hidden p-3 group transition-transform hover:scale-105">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={store.receiptLogoImage} alt="Logo" className="max-w-full max-h-full object-contain filter grayscale brightness-110 dark:invert-[0.1]" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-accent/10 rounded-2xl border border-accent/20 flex items-center justify-center shadow-sm mb-6">
                                <Store size={32} className="text-accent" />
                            </div>
                        )}
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center leading-tight">
                            {store.name}
                        </h1>
                        {store.address && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-3 px-2 leading-relaxed font-medium">
                                {store.address}
                            </p>
                        )}
                        {store.phone && (
                            <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                                <span>Telp: {store.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 md:p-10 space-y-8">
                    {/* Status Badge */}
                    <div className="flex justify-center -mt-14 mb-6">
                        <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 border-2 border-white dark:border-slate-900">
                            <CheckCircle2 size={14} />
                            PEMBAYARAN BERHASIL
                        </div>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">No. Transaksi</p>
                            <p className="font-bold text-slate-900 dark:text-white font-mono text-xs tracking-tighter">#{order.id}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">Waktu & Tanggal</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{formattedDate}</p>
                            <p className="text-slate-500 text-[11px] font-medium">{formattedTime}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">Kasir Melayani</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{order.cashierName || "Sistem"}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em]">Pelanggan</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{order.customerName || "Umum"}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-5 pt-2">
                        <div className="flex items-center gap-3">
                           <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                           <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                               Rincian Belanja
                           </h3>
                           <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>
                        
                        <div className="space-y-4">
                            {order.items.map((item, idx: number) => (
                                <div key={idx} className="flex justify-between items-start group">
                                    <div className="pr-4">
                                        <p className="font-bold text-[15px] text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-accent transition-colors">
                                            {item.productName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                {item.qty} Pcs
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                @ {formatRupiah(item.unitPrice)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="font-bold text-[15px] text-slate-900 dark:text-white whitespace-nowrap font-num">
                                        {formatRupiah(item.subtotal)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-6 space-y-3 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <span>Subtotal</span>
                            <span className="text-slate-900 dark:text-white">{formatRupiah(order.subtotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                <span>Diskon</span>
                                <span>-{formatRupiah(order.discountAmount)}</span>
                            </div>
                        )}
                        {order.shippingFee > 0 && (
                            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <span>Ongkos Kirim</span>
                                <span className="text-slate-900 dark:text-white">{formatRupiah(order.shippingFee)}</span>
                            </div>
                        )}
                        {order.taxAmount > 0 && (
                            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <span>{store.taxName}</span>
                                <span className="text-slate-900 dark:text-white">{formatRupiah(order.taxAmount)}</span>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50 mt-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Total</span>
                                <span className="text-2xl font-black text-accent font-num">
                                    {formatRupiah(order.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 justify-center mb-1">
                            <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">Informasi Pembayaran</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Metode</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{order.paymentMethod}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                <p className="text-xs font-black text-emerald-500">LUNAS</p>
                            </div>
                        </div>
                        
                        {(order.bankName || order.referenceNumber || order.cashPaid) && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium px-4">
                                {order.paymentMethod === "tunai" ? (
                                    <span>Dibayar {formatRupiah(order.cashPaid || 0)} dengan kembalian {formatRupiah(order.changeAmount || 0)}</span>
                                ) : (
                                    <span>Diterima melalui {order.bankName || "Bank"} (Ref: ****{order.referenceNumber})</span>
                                )}
                            </div>
                        )}

                        {order.notes && (
                            <div className="mt-2 text-center">
                                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/20 py-2 px-4 rounded-xl inline-block border border-dashed border-slate-200 dark:border-slate-800">
                                    &ldquo;{order.notes}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer / Thank You */}
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50 text-center space-y-4">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic px-4">
                            &ldquo;{store.footer || "Terima kasih telah berbelanja di toko kami!"}&rdquo;
                        </p>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="w-8 h-1 bg-accent/20 rounded-full mb-1" />
                            <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Powered by Noru POS</p>
                        </div>
                    </div>
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
            border-color: #f1f5f9 !important;
          }
          .absolute { display: none !important; }
          .bg-[#f8fafc] { background: white !important; }
          .rounded-[2.5rem] { border-radius: 0 !important; }
          .shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] { box-shadow: none !important; }
          .bg-emerald-500 { background: #10b981 !important; color: white !important; -webkit-print-color-adjust: exact; }
          .bg-gradient-to-r { background: #000 !important; height: 1px !important; }
        }
      `}} />
        </div>
    );
}

