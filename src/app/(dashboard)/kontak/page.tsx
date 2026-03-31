import { enforceRouteAccess } from '@/lib/actions/permissions';
import { getCustomers } from "@/lib/actions/customers";
import { getSettings } from "@/lib/actions/settings";
import KontakClient from "./kontak-client";

export default async function KontakPage() {
  await enforceRouteAccess('/kontak');
    const [customers, settings] = await Promise.all([
        getCustomers(),
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
            memberTiers={memberTiers}
        />
    );
}
