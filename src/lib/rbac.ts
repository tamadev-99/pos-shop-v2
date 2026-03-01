export type Role = "cashier" | "manager" | "owner";

const rolePermissions: Record<Role, string[]> = {
  cashier: [
    "/", // dashboard
    "/pos",
    "/pesanan",
    "/pelanggan",
    "/barcode",
    "/shift",
    "/notifikasi",
  ],
  manager: [
    "/",
    "/pos",
    "/pesanan",
    "/produk",
    "/inventaris",
    "/pembelian",
    "/supplier",
    "/pelanggan",
    "/retur",
    "/promosi",
    "/laporan",
    "/barcode",
    "/shift",
    "/notifikasi",
  ],
  owner: [
    "/",
    "/pos",
    "/pesanan",
    "/produk",
    "/inventaris",
    "/pembelian",
    "/supplier",
    "/pelanggan",
    "/retur",
    "/promosi",
    "/laporan",
    "/keuangan",
    "/shift",
    "/notifikasi",
    "/barcode",
    "/audit-log",
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
