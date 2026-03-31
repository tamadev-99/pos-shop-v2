import { auth } from "@/lib/auth";
import { db } from "@/db";
import { stores, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { StoreSelectorClient } from "@/app/select-store/store-selector-client";
import { headers } from "next/headers";
import { Sparkles } from "lucide-react";

export default async function SelectStorePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Find user's tenant
  const userTenant = await db.query.tenants.findFirst({
    where: eq(tenants.ownerId, session.user.id),
  });

  // No tenant = belum onboarding
  if (!userTenant) {
    redirect("/onboarding");
  }

  // Get all stores for this tenant
  const tenantStores = await db.query.stores.findMany({
    where: eq(stores.tenantId, userTenant.id),
  });

  // No stores = belum onboarding
  if (tenantStores.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden p-6">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)", top: "5%", right: "10%" }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[160px] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", bottom: "5%", left: "10%" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl w-full animate-fade-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <Sparkles size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Selamat datang, <span className="text-gradient">{session.user.name}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Pilih toko yang ingin Anda kelola hari ini
          </p>
        </div>

        <StoreSelectorClient stores={tenantStores} />
      </div>
    </div>
  );
}
