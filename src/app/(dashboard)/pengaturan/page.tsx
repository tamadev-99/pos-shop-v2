import { getSettings, getUsers } from "@/lib/actions/settings";
import { getAuditLogs } from "@/lib/actions/audit";
import { getAllVariantsFlat } from "@/lib/actions/products";
import PengaturanClient from "./pengaturan-client";

export default async function PengaturanPage() {
    const [settings, users, auditLogs, variants] = await Promise.all([
        getSettings(),
        getUsers(),
        getAuditLogs(),
        getAllVariantsFlat(),
    ]);

    return (
        <PengaturanClient
            initialSettings={settings}
            users={users}
            auditLogs={auditLogs}
            variants={variants as any}
        />
    );
}
