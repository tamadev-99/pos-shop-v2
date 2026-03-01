"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionType =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "transaksi"
  | "pengaturan"
  | "refund";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: ActionType;
  module: string;
  description: string;
  details: string;
  ipAddress: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockAuditLog: AuditEntry[] = [
  {
    id: "AUD-001",
    timestamp: "2026-02-28 14:32:15",
    user: "Admin Utama",
    role: "Admin",
    action: "transaksi",
    module: "Kasir",
    description: "Transaksi penjualan ORD-008",
    details: "Total: Rp 195.000 | Metode: Tunai | 3 item | Kasir: Budi",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-002",
    timestamp: "2026-02-28 14:15:42",
    user: "Budi Kasir",
    role: "Kasir",
    action: "transaksi",
    module: "Kasir",
    description: "Transaksi penjualan ORD-007",
    details: "Total: Rp 62.000 | Metode: E-Wallet | 3 item",
    ipAddress: "192.168.1.12",
  },
  {
    id: "AUD-003",
    timestamp: "2026-02-28 13:50:30",
    user: "Admin Utama",
    role: "Admin",
    action: "update",
    module: "Produk",
    description: "Update harga Indomie Goreng",
    details: "Harga: Rp 3.200 → Rp 3.500 | SKU: MKN-001",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-004",
    timestamp: "2026-02-28 12:30:00",
    user: "Siti Manager",
    role: "Manager",
    action: "create",
    module: "Pembelian",
    description: "Buat Purchase Order PO-2026-001",
    details: "Supplier: PT Indofood | 3 item | Total: Rp 714.000",
    ipAddress: "192.168.1.11",
  },
  {
    id: "AUD-005",
    timestamp: "2026-02-28 11:45:22",
    user: "Admin Utama",
    role: "Admin",
    action: "create",
    module: "Promosi",
    description: "Buat promosi Diskon Akhir Pekan",
    details: "Tipe: Diskon 15% | Berlaku: 22-23 Feb 2026",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-006",
    timestamp: "2026-02-28 09:15:10",
    user: "Admin Utama",
    role: "Admin",
    action: "login",
    module: "Autentikasi",
    description: "Login berhasil",
    details: "Browser: Chrome 122 | OS: Windows 11",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-007",
    timestamp: "2026-02-27 21:00:05",
    user: "Budi Kasir",
    role: "Kasir",
    action: "logout",
    module: "Autentikasi",
    description: "Logout dari sistem",
    details: "Durasi sesi: 8 jam 45 menit",
    ipAddress: "192.168.1.12",
  },
  {
    id: "AUD-008",
    timestamp: "2026-02-27 17:30:18",
    user: "Siti Manager",
    role: "Manager",
    action: "refund",
    module: "Retur",
    description: "Refund untuk RTR-001",
    details: "Order: ORD-002 | Jumlah: Rp 56.000 | Metode: Tunai",
    ipAddress: "192.168.1.11",
  },
  {
    id: "AUD-009",
    timestamp: "2026-02-27 16:20:33",
    user: "Admin Utama",
    role: "Admin",
    action: "delete",
    module: "Produk",
    description: "Hapus produk: Mie Sedaap Cup",
    details: "SKU: MKN-015 | Alasan: Diskontinyu dari supplier",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-010",
    timestamp: "2026-02-27 14:10:45",
    user: "Admin Utama",
    role: "Admin",
    action: "pengaturan",
    module: "Pengaturan",
    description: "Ubah pengaturan pajak",
    details: "PPN: 11% → 12% | Berlaku: 1 Mar 2026",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-011",
    timestamp: "2026-02-27 12:05:00",
    user: "Budi Kasir",
    role: "Kasir",
    action: "transaksi",
    module: "Kasir",
    description: "Transaksi penjualan ORD-006",
    details: "Total: Rp 195.000 | Metode: Tunai | 3 item",
    ipAddress: "192.168.1.12",
  },
  {
    id: "AUD-012",
    timestamp: "2026-02-27 09:00:12",
    user: "Budi Kasir",
    role: "Kasir",
    action: "login",
    module: "Autentikasi",
    description: "Login berhasil",
    details: "Browser: Chrome 122 | OS: Windows 10",
    ipAddress: "192.168.1.12",
  },
  {
    id: "AUD-013",
    timestamp: "2026-02-26 18:30:55",
    user: "Siti Manager",
    role: "Manager",
    action: "update",
    module: "Inventaris",
    description: "Penyesuaian stok Pulpen Pilot",
    details: "Stok: 20 → 5 | Tipe: Koreksi | Catatan: Hasil stock opname",
    ipAddress: "192.168.1.11",
  },
  {
    id: "AUD-014",
    timestamp: "2026-02-26 15:45:20",
    user: "Admin Utama",
    role: "Admin",
    action: "create",
    module: "Pengguna",
    description: "Tambah pengguna baru: Andi Staff",
    details: "Role: Kasir | Email: andi@kasirpro.id",
    ipAddress: "192.168.1.10",
  },
  {
    id: "AUD-015",
    timestamp: "2026-02-26 10:00:30",
    user: "Admin Utama",
    role: "Admin",
    action: "pengaturan",
    module: "Pengaturan",
    description: "Update template struk",
    details: "Header: Toko Maju Jaya | Footer: Terima kasih!",
    ipAddress: "192.168.1.10",
  },
];

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
  ActionType,
  { icon: React.ReactNode; label: string; variant: "default" | "success" | "warning" | "destructive" | "outline"; iconBg: string }
> = {
  login: {
    icon: <LogIn size={14} />,
    label: "Login",
    variant: "success",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400",
  },
  logout: {
    icon: <LogOut size={14} />,
    label: "Logout",
    variant: "outline",
    iconBg: "bg-gradient-to-br from-slate-500/20 to-gray-500/20 text-slate-400",
  },
  create: {
    icon: <PackagePlus size={14} />,
    label: "Tambah",
    variant: "default",
    iconBg: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400",
  },
  update: {
    icon: <Pencil size={14} />,
    label: "Edit",
    variant: "warning",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400",
  },
  delete: {
    icon: <Trash2 size={14} />,
    label: "Hapus",
    variant: "destructive",
    iconBg: "bg-gradient-to-br from-rose-500/20 to-red-500/20 text-rose-400",
  },
  transaksi: {
    icon: <ShoppingCart size={14} />,
    label: "Transaksi",
    variant: "success",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400",
  },
  pengaturan: {
    icon: <Settings size={14} />,
    label: "Pengaturan",
    variant: "outline",
    iconBg: "bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400",
  },
  refund: {
    icon: <DollarSign size={14} />,
    label: "Refund",
    variant: "warning",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 text-amber-400",
  },
};

const userFilter = [
  { label: "Semua Pengguna", value: "all" },
  { label: "Admin Utama", value: "Admin Utama" },
  { label: "Budi Kasir", value: "Budi Kasir" },
  { label: "Siti Manager", value: "Siti Manager" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [userFilterVal, setUserFilterVal] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockAuditLog.filter((entry) => {
    // Tab filter
    if (tab === "transaksi" && entry.action !== "transaksi") return false;
    if (tab === "changes" && !["create", "update", "delete", "refund", "pengaturan"].includes(entry.action)) return false;
    if (tab === "auth" && !["login", "logout"].includes(entry.action)) return false;

    // User filter
    if (userFilterVal !== "all" && entry.user !== userFilterVal) return false;

    // Search
    const q = search.toLowerCase();
    if (q && !(
      entry.description.toLowerCase().includes(q) ||
      entry.module.toLowerCase().includes(q) ||
      entry.user.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q)
    )) return false;

    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Audit Log
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Lacak semua aktivitas pengguna dalam sistem
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => alert("Mengekspor audit log...")}>
          <Download size={14} />
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
            <p className="text-lg md:text-xl font-bold font-num text-foreground">{mockAuditLog.length}</p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]">
            <ShoppingCart size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Transaksi</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {mockAuditLog.filter((e) => e.action === "transaksi").length}
            </p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]">
            <Pencil size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Perubahan</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">
              {mockAuditLog.filter((e) => ["create", "update", "delete", "refund", "pengaturan"].includes(e.action)).length}
            </p>
          </div>
        </Card>
        <Card className="p-3 md:p-4 flex items-center gap-3 animate-fade-up" hover>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(6,182,212,0.25)]">
            <User size={18} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-wider">Pengguna Aktif</p>
            <p className="text-lg md:text-xl font-bold font-num text-foreground">3</p>
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
          const config = actionConfig[entry.action];
          const expanded = expandedId === entry.id;

          return (
            <Card
              key={entry.id}
              className={cn(
                "p-0 overflow-hidden transition-all duration-300 cursor-pointer",
                expanded && "bg-white/[0.04]"
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
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <span className="text-[10px] text-muted-dim">
                          {entry.module}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted-dim font-num">
                          {entry.timestamp.split(" ")[1]}
                        </p>
                        <p className="text-[10px] text-muted-dim font-num">
                          {entry.timestamp.split(" ")[0]}
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
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted-dim uppercase tracking-wider">Pengguna</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
                              <User size={10} className="text-muted-foreground" />
                            </div>
                            <span className="text-xs text-foreground font-medium">{entry.user}</span>
                            <Badge variant="outline">{entry.role}</Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-dim uppercase tracking-wider">Waktu</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} className="text-muted-dim" />
                            <span className="text-xs text-foreground font-num">{entry.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-dim uppercase tracking-wider">Detail</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {entry.details}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-dim uppercase tracking-wider">IP Address</p>
                        <p className="text-xs text-muted-foreground font-num mt-0.5">
                          {entry.ipAddress}
                        </p>
                      </div>
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
