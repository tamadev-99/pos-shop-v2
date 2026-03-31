import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getAuditLogs } from "@/lib/actions/audit";
import { getStockOpnames } from "@/lib/actions/stock-opname";
import { getAllVariantsFlat } from "@/lib/actions/products";
import AuditClient from "./audit-client";

export default async function AuditPage() {
  await enforceRouteAccess('/audit');
  const [auditLogs, opnames, variants] = await Promise.all([
    getAuditLogs(),
    getStockOpnames(),
    getAllVariantsFlat(),
  ]);

  return (
    <AuditClient
      auditLogs={auditLogs}
      opnames={opnames as any}
      variants={variants as any}
    />
  );
}
