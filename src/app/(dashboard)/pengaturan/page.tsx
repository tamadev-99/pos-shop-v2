import { getSettings, getUsers } from "@/lib/actions/settings";
import { getAllVariantsFlat } from "@/lib/actions/products";
import PengaturanClient from "./pengaturan-client";

export default async function PengaturanPage() {
    const [settings, users, variants] = await Promise.all([
        getSettings(),
        getUsers(),
        getAllVariantsFlat(),
    ]);

    return (
        <PengaturanClient
            initialSettings={settings}
            users={users}
            variants={variants as any}
        />
    );
}
