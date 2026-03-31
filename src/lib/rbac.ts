export type Role = "cashier" | "manager" | "owner" | "saas-admin";

const rolePermissions: Record<Role, string[]> = {
  "saas-admin": [
    "/admin/platform",
    "/admin/tenants",
    "/admin/settings",
  ],
  cashier: [
    "/dashboard",
    "/pos",
    "/pesanan",
    "/kontak",
    "/shift",
    "/notifikasi",
  ],
  manager: [
    "/dashboard",
    "/pos",
    "/pesanan",
    "/produk",
    "/pembelian",
    "/kontak",
    "/promosi",
    "/karyawan",
    "/laporan",
    "/shift",
    "/notifikasi",
    "/audit",
  ],
  owner: [
    "/dashboard",
    "/pos",
    "/pesanan",
    "/produk",
    "/pembelian",
    "/kontak",
    "/promosi",
    "/karyawan",
    "/laporan",
    "/shift",
    "/notifikasi",
    "/audit",
    "/pengaturan",
  ],
};

export function getAccessiblePaths(role: string, customOverrides?: Record<string, string[]>): string[] {
  if (role === "owner" || role === "saas-admin") {
    return rolePermissions[role as Role];
  }
  
  if (customOverrides && customOverrides[role]) {
    return customOverrides[role];
  }
  
  return rolePermissions[role as Role] || [];
}

export function hasAccess(role: string, path: string, customOverrides?: Record<string, string[]>): boolean {
  if (role === "owner") return true;
  const allowed = getAccessiblePaths(role, customOverrides);
  return allowed.some((p) => path === p || path.startsWith(p + "/"));
}
