export type Role = "cashier" | "manager" | "owner";

const rolePermissions: Record<Role, string[]> = {
  cashier: [
    "/", // dashboard
    "/pos",
    "/pesanan",
    "/kontak",
    "/shift",
    "/notifikasi",
  ],
  manager: [
    "/",
    "/pos",
    "/pesanan",
    "/produk",
    "/pembelian",
    "/kontak",
    "/promosi",
    "/laporan",
    "/shift",
    "/notifikasi",
  ],
  owner: [
    "/",
    "/pos",
    "/pesanan",
    "/produk",
    "/pembelian",
    "/kontak",
    "/promosi",
    "/laporan",
    "/shift",
    "/notifikasi",
    "/pengaturan",
  ],
};

export function hasAccess(role: Role, path: string): boolean {
  const allowed = rolePermissions[role] || [];
  return allowed.some((p) => path === p || path.startsWith(p + "/"));
}

export function getAccessiblePaths(role: Role): string[] {
  return rolePermissions[role] || [];
}
