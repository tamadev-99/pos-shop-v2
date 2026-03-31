"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/export-csv";
import {
  ShieldCheck,
  Search,
  User,
  LogIn,
  LogOut,
  PackagePlus,
  Pencil,
  Trash2,
  ShoppingCart,
  Settings,
  DollarSign,
  Download,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Users,
  Truck,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditAction =
  | "login"
  | "logout"
  | "transaksi"
  | "stok"
  | "produk"
  | "keuangan"
  | "sistem"
  | "pelanggan"
  | "supplier"
  | "retur";

interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string;
  action: AuditAction;
  detail: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
  employee?: { name: string } | null;
}

export interface AuditLogTabProps {
  auditLogs: AuditEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tabs = [
  { label: "Semua", value: "all" },
  { label: "Transaksi", value: "transaksi" },
  { label: "Perubahan", value: "changes" },
  { label: "Autentikasi", value: "auth" },
];

const actionConfig: Record<
  AuditAction,
  { icon: React.ReactNode; label: string; variant: "default" | "success" | "warning" | "destructive" | "outline"; iconBg: string }
> = {
  login: {
    icon: <LogIn size={14} />,
    label: "Login",
    variant: "success",
    iconBg: "bg-gradient-to-br from-violet-500/20 to-indigo-600/20 text-accent",
  },
  logout: {
    icon: <LogOut size={14} />,
    label: "Logout",
    variant: "outline",
    iconBg: "bg-gradient-to-br from-slate-500/20 to-gray-500/20 text-slate-400",
  },
  transaksi: {
    icon: <ShoppingCart size={14} />,
    label: "Transaksi",
    variant: "success",
    iconBg: "bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-accent",
  },
  stok: {
    icon: <Package size={14} />,
    label: "Stok",
    variant: "warning",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400",
  },
  produk: {
    icon: <PackagePlus size={14} />,
    label: "Produk",
    variant: "default",
    iconBg: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400",
  },
  keuangan: {
    icon: <DollarSign size={14} />,
    label: "Keuangan",
    variant: "warning",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-400",
  },
  sistem: {
    icon: <Settings size={14} />,
    label: "Sistem",
    variant: "outline",
    iconBg: "bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400",
  },
  pelanggan: {
    icon: <Users size={14} />,
    label: "Pelanggan",
    variant: "default",
    iconBg: "bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400",
  },
  supplier: {
    icon: <Truck size={14} />,
    label: "Supplier",
    variant: "default",
    iconBg: "bg-gradient-to-br from-teal-500/20 to-green-500/20 text-accent",
  },
  retur: {
    icon: <RotateCcw size={14} />,
    label: "Retur",
    variant: "warning",
    iconBg: "bg-gradient-to-br from-rose-500/20 to-red-500/20 text-rose-400",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogTab({ auditLogs }: AuditLogTabProps) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [userFilterVal, setUserFilterVal] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build user filter options from actual data
  const uniqueUsers = Array.from(new Set(auditLogs.map((e) => e.employee?.name || e.userName))).sort();
  const userFilter = [
    { label: "Semua Pengguna", value: "all" },
    ...uniqueUsers.map((name) => ({ label: name, value: name })),
  ];

  const filtered = auditLogs.filter((entry) => {
    // Tab filter
    if (tab === "transaksi" && entry.action !== "transaksi") return false;
    if (tab === "changes" && !["stok", "produk", "keuangan", "sistem", "pelanggan", "supplier", "retur"].includes(entry.action)) return false;
    if (tab === "auth" && !["login", "logout"].includes(entry.action)) return false;

    // User filter
    if (userFilterVal !== "all" && entry.userName !== userFilterVal) return false;

    // Search
    const q = search.toLowerCase();
    if (q && !(
      entry.detail.toLowerCase().includes(q) ||
      (entry.employee?.name || entry.userName).toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q)
    )) return false;

    return true;
  });

  // Compute stats
  const totalLogs = auditLogs.length;
  const transaksiCount = auditLogs.filter((e) => e.action === "transaksi").length;
  const changesCount = auditLogs.filter((e) => !["login", "logout", "transaksi"].includes(e.action)).length;
  const activeUsers = new Set(auditLogs.map((e) => e.employee?.name || e.userName)).size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-up">
        <h2 className="text-sm font-semibold text-foreground">Audit Log</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const data = filtered.map((entry) => ({
              waktu: new Date(entry.createdAt).toLocaleString("id-ID"),
              pengguna: entry.employee?.name || entry.userName,
              aksi: actionConfig[entry.action]?.label || entry.action,
              detail: entry.detail,
              metadata: entry.metadata ? JSON.stringify(entry.metadata) : "",
              ip: entry.ipAddress || "",
            }));
            exportToCSV(data, "audit-log", [
              { key: "waktu", label: "Waktu" },
              { key: "pengguna", label: "Pengguna" },
              { key: "aksi", label: "Aksi" },
              { key: "detail", label: "Detail" },
              { key: "metadata", label: "Metadata" },
              { key: "ip", label: "IP Address" },
            ]);
          }}
        >
          <Download size={14} className="mr-1" />
          Ekspor CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 stagger">
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.25)]">
            <ShieldCheck size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Total Log</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{totalLogs}</p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <ShoppingCart size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Transaksi</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{transaksiCount}</p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <Pencil size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Perubahan</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{changesCount}</p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(6,182,212,0.25)]">
            <User size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Pengguna Aktif</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{activeUsers}</p>
          </div>
        </Card>
      </div>

      {/* Tabs + Filters */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            options={userFilter}
            value={userFilterVal}
            onChange={(e) => setUserFilterVal(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Cari aktivitas..."
            icon={<Search size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-[200px]"
          />
        </div>
      </div>

      {/* Timeline Log */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "180ms" }}>
        {filtered.map((entry) => {
          const config = actionConfig[entry.action] || actionConfig.sistem;
          const expanded = expandedId === entry.id;
          const timestamp = new Date(entry.createdAt);

          return (
            <Card
              key={entry.id}
              className={cn(
                "p-0 overflow-hidden transition-all duration-300 cursor-pointer",
                expanded && "bg-card"
              )}
            >
              <div
                className="p-3 md:p-4 flex items-start gap-3"
                onClick={() => setExpandedId(expanded ? null : entry.id)}
              >
                {/* Timeline dot */}
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", config.iconBg)}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.detail}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted-dim font-num">
                          {timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                        <p className="text-[10px] text-muted-dim font-num">
                          {timestamp.toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      {expanded ? (
                        <ChevronUp size={14} className="text-muted-dim" />
                      ) : (
                        <ChevronDown size={14} className="text-muted-dim" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted-dim uppercase tracking-wider">Pengguna</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-surface flex items-center justify-center">
                              <User size={10} className="text-muted-foreground" />
                            </div>
                            <span className="text-xs text-foreground font-medium">{entry.employee?.name || entry.userName}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-dim uppercase tracking-wider">Waktu</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} className="text-muted-dim" />
                            <span className="text-xs text-foreground font-num">
                              {timestamp.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-dim uppercase tracking-wider">Metadata</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-num">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </p>
                        </div>
                      )}
                      {entry.ipAddress && (
                        <div>
                          <p className="text-[10px] text-muted-dim uppercase tracking-wider">IP Address</p>
                          <p className="text-xs text-muted-foreground font-num mt-0.5">
                            {entry.ipAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <ShieldCheck size={32} className="text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              Tidak ada log ditemukan
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
