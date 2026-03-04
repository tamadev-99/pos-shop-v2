import { getNotifications } from "@/lib/actions/notifications";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NotifikasiClient from "./notifikasi-client";

export default async function NotifikasiPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Ambil notifikasi untuk user ini, atau fallback kosong jika tidak ada session
  const notifications = session?.user
    ? await getNotifications(session.user.id)
    : [];

  return <NotifikasiClient notifications={notifications} />;
}
