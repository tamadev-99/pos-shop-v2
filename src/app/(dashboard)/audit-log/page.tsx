import { getAuditLogs } from "@/lib/actions/audit";
import AuditLogClient from "./audit-log-client";

export default async function AuditLogPage() {
  const auditLogs = await getAuditLogs();

  return <AuditLogClient auditLogs={auditLogs} />;
}
