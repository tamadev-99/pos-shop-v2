import { getSettings, getUsers } from "@/lib/actions/settings";
import PengaturanClient from "./pengaturan-client";

export default async function PengaturanPage() {
    const [settings, users] = await Promise.all([
        getSettings(),
        getUsers(),
    ]);

    return <PengaturanClient initialSettings={settings} users={users} />;
}
