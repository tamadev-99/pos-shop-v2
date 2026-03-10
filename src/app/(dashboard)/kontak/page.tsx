import { getCustomers } from "@/lib/actions/customers";
import { getEmployees } from "@/lib/actions/employees";
import { getSettings } from "@/lib/actions/settings";
import KontakClient from "./kontak-client";

export default async function KontakPage() {
    const [customers, employees, settings] = await Promise.all([
        getCustomers(),
        getEmployees(),
        getSettings(),
    ]);

    // Parse memberTiers from settings
    let memberTiers;
    try {
        const raw = settings.memberTiers;
        memberTiers = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : undefined;
    } catch {
        memberTiers = undefined;
    }

    return (
        <KontakClient
            initialCustomers={customers as any}
            initialEmployees={employees as any}
            memberTiers={memberTiers}
        />
    );
}
