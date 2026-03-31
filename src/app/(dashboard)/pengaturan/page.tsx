import { getSettings } from "@/lib/actions/settings";
import { getAllVariantsFlat } from "@/lib/actions/products";
import PengaturanClient from "./pengaturan-client";
import { enforceRouteAccess } from "@/lib/actions/permissions";

export default async function PengaturanPage() {
    await enforceRouteAccess("/pengaturan");

    const [settings, variants] = await Promise.all([
        getSettings(),
        getAllVariantsFlat(),
    ]);

    return (
        <PengaturanClient
            initialSettings={settings}
            variants={variants as any}
        />
    );
}
