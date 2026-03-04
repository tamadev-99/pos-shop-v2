"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Info,
  Trash2,
  CheckCheck,
  TicketPercent,
  ShoppingCart,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
} from "@/lib/actions/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotifType = "stok_rendah" | "pesanan_baru" | "pembayaran" | "sistem" | "promo";
type NotifPriority = "low" | "normal" | "high" | "urgent";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  priority: NotifPriority;
  isRead: boolean;
  userId: string | null;
  createdAt: Date;
}

export interface NotifikasiClientProps {
  notifications: Notification[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tabs = [
  { label: "Semua", value: "all" },
  { label: "Belum Dibaca", value: "unread" },
  { label: "Stok", value: "stok_rendah" },
  { label: "Pesanan", value: "pesanan_baru" },
  { label: "Sistem", value: "sistem" },
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
  pesanan_baru: {
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
  pembayaran: {
    icon: <TrendingDown size={16} className="text-accent" />,
    iconBg:
      "bg-gradient-to-br from-violet-500/20 to-indigo-600/20 shadow-[0_0_12px_-3px_rgba(16,185,129,0.25)]",
    accentBorder: "border-l-emerald-500/50",
  },
};

const priorityBadge: Record<
  NotifPriority,
  { label: string; variant: "destructive" | "warning" | "outline" | "default" }
> = {
  urgent: { label: "Urgent", variant: "destructive" },
  high: { label: "Penting", variant: "destructive" },
  normal: { label: "Sedang", variant: "warning" },
  low: { label: "Info", variant: "outline" },
};

function timeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return new Date(date).toLocaleDateString("id-ID");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotifikasiClient({ notifications: initialNotifications }: NotifikasiClientProps) {
  const [tab, setTab] = useState("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const unreadCount = initialNotifications.filter((n) => !n.isRead).length;

  const filtered = initialNotifications.filter((n) => {
    if (tab === "all") return true;
    if (tab === "unread") return !n.isRead;
    return n.type === tab;
  });

  function handleMarkAsRead(id: string) {
    startTransition(async () => {
      try {
        await markAsReadAction(id);
        router.refresh();
        toast.success("Notifikasi ditandai sudah dibaca");
      } catch {
        toast.error("Gagal menandai notifikasi");
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllAsReadAction();
        router.refresh();
        toast.success("Semua notifikasi ditandai sudah dibaca");
      } catch {
        toast.error("Gagal menandai semua notifikasi");
      }
    });
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
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-accent to-accent-hover text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau aktivitas dan peringatan sistem
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead} disabled={isPending}>
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
          const config = typeConfig[notif.type] || typeConfig.sistem;
          const priority = priorityBadge[notif.priority] || priorityBadge.low;
          return (
            <Card
              key={notif.id}
              className={cn(
                "p-0 overflow-hidden border-l-2 transition-all duration-300",
                config.accentBorder,
                !notif.isRead && "bg-surface"
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
                            notif.isRead
                              ? "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
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
                      {timeAgo(notif.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="h-7 w-7"
                          disabled={isPending}
                        >
                          <CheckCircle2 size={13} className="text-accent" />
                        </Button>
                      )}
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
