"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { cn, formatRupiah } from "@/lib/utils";
import {
  Bell,
  AlertTriangle,
  Package,
  TrendingDown,
  CheckCircle2,
  Info,
  Trash2,
  CheckCheck,
  TicketPercent,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotifType = "stok_rendah" | "pesanan" | "promo" | "sistem" | "keuangan";
type NotifPriority = "high" | "medium" | "low";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotifPriority;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "stok_rendah",
    title: "Stok Kritis: Silverqueen 65g",
    message: "Stok tersisa 3 unit, di bawah minimum 10 unit. Segera lakukan restock.",
    timestamp: "2026-02-28 14:32",
    read: false,
    priority: "high",
  },
  {
    id: "2",
    type: "stok_rendah",
    title: "Stok Rendah: Pulpen Pilot",
    message: "Stok tersisa 5 unit, di bawah minimum 20 unit.",
    timestamp: "2026-02-28 14:30",
    read: false,
    priority: "high",
  },
  {
    id: "3",
    type: "pesanan",
    title: "Pesanan Baru: ORD-008",
    message: "Pesanan baru dari Ahmad Fauzi senilai Rp 195.000 menunggu proses.",
    timestamp: "2026-02-28 13:15",
    read: false,
    priority: "medium",
  },
  {
    id: "4",
    type: "promo",
    title: "Promosi Akan Berakhir",
    message: "Promo 'Hemat Minuman' akan berakhir pada 28 Feb 2026.",
    timestamp: "2026-02-28 09:00",
    read: false,
    priority: "medium",
  },
  {
    id: "5",
    type: "keuangan",
    title: "Ringkasan Penjualan Harian",
    message: "Total penjualan hari ini: Rp 5.800.000 dari 42 transaksi.",
    timestamp: "2026-02-27 21:00",
    read: true,
    priority: "low",
  },
  {
    id: "6",
    type: "stok_rendah",
    title: "Stok Rendah: Pocky Chocolate",
    message: "Stok tersisa 8 unit, di bawah minimum 15 unit.",
    timestamp: "2026-02-27 16:45",
    read: true,
    priority: "high",
  },
  {
    id: "7",
    type: "sistem",
    title: "Pembaruan Sistem Berhasil",
    message: "KasirPro telah diperbarui ke versi 2.4.1 dengan perbaikan bug.",
    timestamp: "2026-02-27 03:00",
    read: true,
    priority: "low",
  },
  {
    id: "8",
    type: "pesanan",
    title: "Pesanan Dibatalkan: ORD-005",
    message: "Pesanan ORD-005 dibatalkan oleh pelanggan.",
    timestamp: "2026-02-26 12:55",
    read: true,
    priority: "medium",
  },
  {
    id: "9",
    type: "keuangan",
    title: "Pembayaran Supplier Jatuh Tempo",
    message: "Pembayaran ke PT Indofood sebesar Rp 714.000 jatuh tempo besok.",
    timestamp: "2026-02-26 09:00",
    read: true,
    priority: "high",
  },
  {
    id: "10",
    type: "promo",
    title: "Promo Baru Aktif",
    message: "Promo 'Beli 2 Gratis 1 Snack' sudah aktif mulai hari ini.",
    timestamp: "2026-02-15 08:00",
    read: true,
    priority: "low",
  },
  {
    id: "11",
    type: "stok_rendah",
    title: "Stok Rendah: Pasta Gigi Pepsodent",
    message: "Stok tersisa 12 unit, di bawah minimum 20 unit.",
    timestamp: "2026-02-24 10:20",
    read: true,
    priority: "high",
  },
  {
    id: "12",
    type: "sistem",
    title: "Backup Data Berhasil",
    message: "Backup otomatis data toko berhasil dilakukan pada 25 Feb 2026.",
    timestamp: "2026-02-25 02:00",
    read: true,
    priority: "low",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tabs = [
  { label: "Semua", value: "all" },
  { label: "Belum Dibaca", value: "unread" },
  { label: "Stok", value: "stok_rendah" },
  { label: "Pesanan", value: "pesanan" },
  { label: "Keuangan", value: "keuangan" },
];

const typeConfig: Record<
  NotifType,
  { icon: React.ReactNode; iconBg: string; accentBorder: string }
> = {
  stok_rendah: {
    icon: <AlertTriangle size={16} className="text-amber-400" />,
    iconBg:
      "bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)]",
    accentBorder: "border-l-amber-500/50",
  },
  pesanan: {
    icon: <ShoppingCart size={16} className="text-cyan-400" />,
    iconBg:
      "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-[0_0_12px_-3px_rgba(6,182,212,0.25)]",
    accentBorder: "border-l-cyan-500/50",
  },
  promo: {
    icon: <TicketPercent size={16} className="text-violet-400" />,
    iconBg:
      "bg-gradient-to-br from-violet-500/20 to-purple-500/20 shadow-[0_0_12px_-3px_rgba(139,92,246,0.25)]",
    accentBorder: "border-l-violet-500/50",
  },
  sistem: {
    icon: <Info size={16} className="text-sky-400" />,
    iconBg:
      "bg-gradient-to-br from-sky-500/20 to-indigo-500/20 shadow-[0_0_12px_-3px_rgba(56,189,248,0.25)]",
    accentBorder: "border-l-sky-500/50",
  },
  keuangan: {
    icon: <TrendingDown size={16} className="text-emerald-400" />,
    iconBg:
      "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-[0_0_12px_-3px_rgba(16,185,129,0.25)]",
    accentBorder: "border-l-emerald-500/50",
  },
};

const priorityBadge: Record<
  NotifPriority,
  { label: string; variant: "destructive" | "warning" | "outline" }
> = {
  high: { label: "Penting", variant: "destructive" },
  medium: { label: "Sedang", variant: "warning" },
  low: { label: "Info", variant: "outline" },
};

function timeAgo(timestamp: string) {
  const now = new Date("2026-02-28T15:00:00");
  const then = new Date(timestamp.replace(" ", "T"));
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return timestamp.split(" ")[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotifikasiPage() {
  const [tab, setTab] = useState("all");
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (tab === "all") return true;
    if (tab === "unread") return !n.read;
    return n.type === tab;
  });

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function deleteNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-accent to-accent-secondary text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau aktivitas dan peringatan sistem
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {/* Notification List */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
        {filtered.map((notif) => {
          const config = typeConfig[notif.type];
          const priority = priorityBadge[notif.priority];
          return (
            <Card
              key={notif.id}
              className={cn(
                "p-0 overflow-hidden border-l-2 transition-all duration-300",
                config.accentBorder,
                !notif.read && "bg-white/[0.05]"
              )}
            >
              <div className="p-3 md:p-4 flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    config.iconBg
                  )}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            notif.read
                              ? "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-dim font-num">
                      {timeAgo(notif.timestamp)}
                    </span>
                    <div className="flex items-center gap-1">
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notif.id)}
                          className="h-7 w-7"
                        >
                          <CheckCircle2 size={13} className="text-accent" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotif(notif.id)}
                        className="h-7 w-7"
                      >
                        <Trash2 size={13} className="text-destructive/60" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell size={32} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              Tidak ada notifikasi
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Semua notifikasi sudah dibaca
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
