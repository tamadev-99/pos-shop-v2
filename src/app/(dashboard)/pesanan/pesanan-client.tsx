"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils";
import { Search, Eye, FileText, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { cancelOrder } from "@/lib/actions/orders";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DBOrderItem {
  id: string;
  orderId: string;
  variantId: string | null;
  productName: string;
  variantInfo: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

interface DBOrder {
  id: string;
  customerId: string | null;
  customerName: string;
  date: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  total: number;
  status: "pending" | "selesai" | "dibatalkan";
  paymentMethod: "tunai" | "debit" | "kredit" | "transfer" | "qris" | "ewallet";
  cashierId: string | null;
  shiftId: string | null;
  notes: string | null;
  createdAt: Date;
  items: DBOrderItem[];
}

interface Order {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: "selesai" | "pending" | "dibatalkan";
  method: string;
  items: { name: string; qty: number; price: number }[];
  shippingFee: number;
  taxAmount: number;
  subtotal: number;
  discountAmount: number;
}

const paymentMethodLabels: Record<string, string> = {
  tunai: "Tunai",
  debit: "Debit",
  kredit: "Kredit",
  transfer: "Transfer",
  qris: "QRIS",
  ewallet: "E-Wallet",
};

function mapDBOrderToOrder(dbOrder: DBOrder): Order {
  return {
    id: dbOrder.id,
    date: new Date(dbOrder.date).toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    customer: dbOrder.customerName || "Pelanggan Umum",
    total: dbOrder.total,
    status: dbOrder.status,
    method: paymentMethodLabels[dbOrder.paymentMethod] || dbOrder.paymentMethod,
    items: dbOrder.items.map((item) => ({
      name: `${item.productName} (${item.variantInfo})`,
      qty: item.qty,
      price: item.unitPrice,
    })),
    shippingFee: dbOrder.shippingFee,
    taxAmount: dbOrder.taxAmount,
    subtotal: dbOrder.subtotal,
    discountAmount: dbOrder.discountAmount,
  };
}

const statusVariant: Record<string, BadgeVariant> = {
  selesai: "success",
  pending: "warning",
  dibatalkan: "destructive",
};

const statusLabel: Record<string, string> = {
  selesai: "Selesai",
  pending: "Pending",
  dibatalkan: "Dibatalkan",
};

const tabOptions = [
  { label: "Semua", value: "all" },
  { label: "Selesai", value: "selesai" },
  { label: "Pending", value: "pending" },
  { label: "Dibatalkan", value: "dibatalkan" },
];

interface PesananClientProps {
  initialOrders: DBOrder[];
}

export default function PesananClient({ initialOrders }: PesananClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const orders = initialOrders.map(mapDBOrderToOrder);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast.success(`Pesanan ${orderId} berhasil dibatalkan`);
      setSelectedOrder(null);
      router.refresh();
    } catch (error) {
      toast.error("Gagal membatalkan pesanan");
      console.error("Cancel order error:", error);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="animate-fade-up">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
          Pesanan
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Kelola dan lihat riwayat pesanan
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Tabs tabs={tabOptions} value={filter} onChange={setFilter} />
        <Input
          placeholder="Cari pesanan..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-[220px]"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  ID Pesanan
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden md:table-cell">
                  Tanggal
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden sm:table-cell">
                  Pelanggan
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Total
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider hidden lg:table-cell">
                  Metode
                </th>
                <th className="px-3 md:px-4 py-3 text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-all duration-300"
                >
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                    {order.id}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground font-num hidden md:table-cell">
                    {order.date}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-foreground hidden sm:table-cell">
                    {order.customer}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs font-semibold text-foreground font-num">
                    {formatRupiah(order.total)}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Badge variant={statusVariant[order.status]}>
                      {statusLabel[order.status]}
                    </Badge>
                  </td>
                  <td className="px-3 md:px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {order.method}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <FileText size={28} className="mx-auto mb-2 opacity-10" />
                    Tidak ada pesanan ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        className="max-w-md"
      >
        {selectedOrder && (
          <>
            <DialogClose onClose={() => setSelectedOrder(null)} />
            <DialogHeader>
              <DialogTitle>Detail Pesanan {selectedOrder.id}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">Pelanggan</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {selectedOrder.customer}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">Tanggal</p>
                  <p className="text-xs font-medium text-foreground font-num mt-0.5">
                    {selectedOrder.date}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">Metode</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">
                    {selectedOrder.method}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-dim uppercase tracking-wider">Status</p>
                  <div className="mt-0.5">
                    <Badge variant={statusVariant[selectedOrder.status]}>
                      {statusLabel[selectedOrder.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase">
                        Item
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase text-center">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-muted-dim uppercase text-right">
                        Harga
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, i) => (
                      <tr key={i} className="border-t border-white/[0.04]">
                        <td className="px-3 py-2 text-xs text-foreground">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-xs text-center font-num text-muted-foreground">
                          {item.qty}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-num text-foreground">
                          {formatRupiah(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="text-xs font-num text-muted-foreground">
                    {formatRupiah(selectedOrder.subtotal)}
                  </span>
                </div>
                {selectedOrder.taxAmount > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-muted-foreground">PPN</span>
                    <span className="text-xs font-num text-muted-foreground">
                      {formatRupiah(selectedOrder.taxAmount)}
                    </span>
                  </div>
                )}
                {selectedOrder.shippingFee > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-muted-foreground">Ongkir</span>
                    <span className="text-xs font-num text-muted-foreground">
                      {formatRupiah(selectedOrder.shippingFee)}
                    </span>
                  </div>
                )}
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs text-muted-foreground">Diskon</span>
                    <span className="text-xs font-num text-muted-foreground">
                      -{formatRupiah(selectedOrder.discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                <span className="text-sm font-semibold text-foreground">
                  Total
                </span>
                <span className="text-sm font-bold font-num text-gradient">
                  {formatRupiah(selectedOrder.total)}
                </span>
              </div>

              {/* Cancel order button - only for pending/selesai orders */}
              {selectedOrder.status !== "dibatalkan" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  size="sm"
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  disabled={isPending}
                >
                  <XCircle size={14} />
                  {isPending ? "Membatalkan..." : "Batalkan Pesanan"}
                </Button>
              )}
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
