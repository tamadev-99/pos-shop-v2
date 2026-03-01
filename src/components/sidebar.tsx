"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { authClient } from "@/lib/auth-client";
import { hasAccess, type Role } from "@/lib/rbac";
import {
  LayoutDashboard,
  Monitor,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Building2,
  TicketPercent,
  Users,
  BarChart3,
  Wallet,
  Clock,
  RotateCcw,
  Bell,
  QrCode,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
  Menu,
  X,
  User,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Kasir", href: "/pos", icon: Monitor },
  { label: "Pesanan", href: "/pesanan", icon: ShoppingCart },
  { label: "Produk", href: "/produk", icon: Package },
  { label: "Inventaris", href: "/inventaris", icon: Warehouse },
  { label: "Pembelian", href: "/pembelian", icon: Truck },
  { label: "Supplier", href: "/supplier", icon: Building2 },
  { label: "Pelanggan", href: "/pelanggan", icon: Users },
  { label: "Retur", href: "/retur", icon: RotateCcw },
  { label: "Promosi", href: "/promosi", icon: TicketPercent },
  { label: "Laporan", href: "/laporan", icon: BarChart3 },
  { label: "Keuangan", href: "/keuangan", icon: Wallet },
  { label: "Shift", href: "/shift", icon: Clock },
  { label: "Notifikasi", href: "/notifikasi", icon: Bell },
  { label: "Barcode", href: "/barcode", icon: QrCode },
  { label: "Audit Log", href: "/audit-log", icon: ShieldCheck },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
];

const roleLabels: Record<string, string> = {
  cashier: "Kasir",
  manager: "Manajer",
  owner: "Owner",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = (user?.role || "cashier") as Role;

  const filteredNavItems = navItems.filter((item) =>
    hasAccess(userRole, item.href)
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-white shrink-0 shadow-[0_0_24px_-3px_rgba(16,185,129,0.3)]">
            <Zap size={16} />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight font-[family-name:var(--font-display)]">
              <span className="text-gradient">KasirPro</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 lg:py-2 text-sm font-medium transition-all duration-300",
                active
                  ? "text-foreground bg-white/[0.07] shadow-[0_2px_12px_-3px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                collapsed && "lg:justify-center lg:px-0"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-gradient-to-b from-accent to-accent-secondary shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
              )}
              <item.icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors duration-300",
                  active && "text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                )}
              />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + Footer */}
      <div className="border-t border-white/[0.06] p-2 space-y-0.5">
        {/* User info */}
        {user && (!collapsed || mobileOpen) && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
              <User size={14} className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-accent">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-300 w-full cursor-pointer",
            collapsed && "justify-center px-0"
          )}
        >
          <ChevronLeft
            size={18}
            className={cn(
              "shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Tutup Sidebar</span>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 lg:py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 w-full cursor-pointer",
            collapsed && !mobileOpen && "lg:justify-center lg:px-0"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {(!collapsed || mobileOpen) && <span>Keluar</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — frosted glass */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] bg-[#07080f]/80 backdrop-blur-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-secondary text-white shadow-[0_0_16px_-3px_rgba(16,185,129,0.3)]">
            <Zap size={14} />
          </div>
          <span className="font-semibold text-sm tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-gradient">KasirPro</span>
          </span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-md animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — heavy glass */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col",
          "bg-[#0a0b14]/90 backdrop-blur-2xl",
          "border-r border-white/[0.06]",
          "shadow-[4px_0_32px_-4px_rgba(0,0,0,0.4)]",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar — glass panel */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen shrink-0",
          "glass-sidebar",
          "transition-all duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
