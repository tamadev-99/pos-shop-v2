"use client";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { authClient } from "@/lib/auth-client";
import { hasAccess, type Role } from "@/lib/rbac";
import { getNotifications } from "@/lib/actions/notifications";
import { createAuditLog } from "@/lib/actions/audit";
import { usePollingNotifications } from "@/hooks/use-polling-notifications";
import {
  LayoutDashboard,
  Monitor,
  ShoppingCart,
  Package,
  Truck,
  Users,
  TicketPercent,
  BarChart3,
  CreditCard,
  Clock,
  Bell,
  ClipboardCheck,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  User,
  Sparkles,
  Sun,
  Moon,
  ArrowLeftRight,
  UserRoundCog,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearEmployeeSession, switchStore } from "@/app/select-employee/actions";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Kasir", href: "/pos", icon: Monitor, group: "main" },
  { label: "Pesanan & Retur", href: "/pesanan", icon: ShoppingCart, group: "main" },
  { label: "Katalog & Stok", href: "/produk", icon: Package, group: "inventory" },
  { label: "Pembelian & Pemasok", href: "/pembelian", icon: Truck, group: "inventory" },
  { label: "Member", href: "/kontak", icon: Users, group: "people" },
  { label: "Promosi", href: "/promosi", icon: TicketPercent, group: "people" },
  { label: "Karyawan", href: "/karyawan", icon: UserRoundCog, group: "people" },
  { label: "Laporan & Keuangan", href: "/laporan", icon: BarChart3, group: "system" },
  { label: "Shift", href: "/shift", icon: Clock, group: "system" },
  { label: "Audit", href: "/audit", icon: ClipboardCheck, group: "system" },
  { label: "Notifikasi", href: "/notifikasi", icon: Bell, group: "system" },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings, group: "system" },
  
  // Platform Admin
  { label: "Performa Platform", href: "/admin", icon: BarChart3, group: "platform" },
  { label: "Data Tenant", href: "/admin/tenants", icon: Users, group: "platform" },
  { label: "Biaya Langganan", href: "/admin/plans", icon: TicketPercent, group: "platform" },
  { label: "Log Transaksi", href: "/admin/transactions", icon: CreditCard, group: "platform" },
];

const groupLabels: Record<string, string> = {
  main: "Menu Utama",
  inventory: "Inventaris",
  people: "Orang",
  system: "Sistem & Pengaturan",
  platform: "Platform Admin",
};

const roleLabels: Record<string, string> = {
  cashier: "Kasir",
  manager: "Manajer",
  admin: "Admin",
  owner: "Owner",
};

interface SidebarProps {
  customPermissions?: Record<string, string[]>;
}

export function Sidebar({ customPermissions }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, activeEmployeeName, activeEmployeeRole, activeEmployeeProfileId, activeStoreId } = useAuth();

  // Start polling notifications
  usePollingNotifications();

  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const userRole = (activeEmployeeRole || user?.role || "cashier") as Role;
  const displayName = activeEmployeeName || user?.name || "User";
  const displayRole = activeEmployeeRole || user?.role || "cashier";

  const groupedNavItems: Record<string, typeof navItems> = {};
  navItems.forEach((item) => {
    if (!groupedNavItems[item.group]) groupedNavItems[item.group] = [];
    groupedNavItems[item.group].push(item);
  });

  useEffect(() => {
    setMobileOpen(false);
    if (user?.id) {
      getNotifications().then((notifs) => {
        const unread = notifs.filter((n) => !n.isRead).length;
        setUnreadNotifCount(unread);
      }).catch(() => { });
    }
  }, [pathname, user?.id]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    if (user) {
      createAuditLog({
        employeeProfileId: activeEmployeeProfileId,
        storeId: activeStoreId || "system",
        userName: displayName,
        action: "logout",
        detail: `${displayName} logout`,
        metadata: { email: user.email },
      }).catch(() => { });
    }
    await authClient.signOut();
    window.location.href = "/login";
  };

  const handleSwitchEmployee = async () => {
    await clearEmployeeSession();
    router.push("/select-employee");
    router.refresh();
  };

  const handleSwitchStore = async () => {
    await switchStore();
    router.push("/select-store");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shrink-0 shadow-md">
            <Sparkles size={18} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-foreground">
                Noru POS
              </span>
              <span className="text-[10px] font-medium tracking-wider text-accent uppercase mt-0.5">
                Point of Sale
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2.5 overflow-y-auto space-y-4">
        {Object.entries(groupedNavItems).map(([group, items]) => {
          const visibleItems = items.filter((item) => {
            if (item.href === "/" && !user) return false;
            return hasAccess(userRole, item.href, customPermissions);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group}>
              {(!collapsed || mobileOpen) && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50">
                  {groupLabels[group]}
                </p>
              )}
              {collapsed && !mobileOpen && (
                <div className="w-6 h-px bg-border mx-auto mb-2" />
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-200",
                        active
                          ? "font-semibold text-accent bg-accent-muted border border-accent/15"
                          : "font-medium text-muted-foreground hover:text-foreground hover:bg-surface",
                        collapsed && !mobileOpen && "lg:justify-center lg:px-0"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-accent" />
                      )}
                      <item.icon
                        size={18}
                        className={cn(
                          "shrink-0 transition-colors duration-200",
                          active ? "text-accent" : "group-hover:text-foreground"
                        )}
                      />
                      {item.href === "/notifikasi" && unreadNotifCount > 0 && (
                        <span className="absolute left-[22px] top-[6px] w-2 h-2 rounded-full bg-destructive ring-2 ring-card-solid" />
                      )}
                      {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                      {(!collapsed || mobileOpen) && item.href === "/notifikasi" && unreadNotifCount > 0 && (
                        <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-destructive-muted text-destructive text-[10px] font-bold border border-destructive/20">
                          {unreadNotifCount}
                        </span>
                      )}
                      {collapsed && !mobileOpen && (
                        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-card-solid text-foreground text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-[var(--shadow-lg)] border border-border z-50">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2.5 space-y-1 border-t border-border">
        {/* Active employee card */}
        {user && (!collapsed || mobileOpen) && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-surface border border-border transition-colors">
            <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center shrink-0 border border-accent/10">
              <User size={14} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-accent/70">
                {roleLabels[displayRole] || displayRole}
              </p>
            </div>
          </div>
        )}

        {/* Switch Employee */}
        {(!collapsed || mobileOpen) && userRole !== "saas-admin" && (
          <button
            onClick={handleSwitchEmployee}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200 w-full cursor-pointer"
          >
            <ArrowLeftRight size={16} className="shrink-0" />
            <span>Ganti Karyawan</span>
          </button>
        )}

        {/* Switch Store */}
        {(!collapsed || mobileOpen) && userRole !== "saas-admin" && (
          <button
            onClick={handleSwitchStore}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200 w-full cursor-pointer"
          >
            <Store size={16} className="shrink-0" />
            <span>Ganti Toko</span>
          </button>
        )}


        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200 w-full cursor-pointer",
            collapsed && !mobileOpen && "lg:justify-center lg:px-0"
          )}
        >
          {theme === "dark" ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
          {(!collapsed || mobileOpen) && <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200 w-full cursor-pointer",
            collapsed && "justify-center px-0"
          )}
        >
          <ChevronLeft size={16} className={cn("shrink-0 transition-transform duration-300", collapsed && "rotate-180")} />
          {!collapsed && <span>Tutup Sidebar</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive-muted transition-all duration-200 w-full cursor-pointer",
            collapsed && !mobileOpen && "lg:justify-center lg:px-0"
          )}
        >
          <LogOut size={16} className="shrink-0 transition-colors group-hover:text-destructive" />
          {(!collapsed || mobileOpen) && <span>Keluar</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-background-secondary/90 backdrop-blur-xl border-b border-border shadow-[var(--shadow-sm)]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
            <Sparkles size={14} />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            Noru POS
          </span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col",
          "bg-background-secondary",
          "border-r border-border",
          "shadow-[var(--shadow-lg)]",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
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
