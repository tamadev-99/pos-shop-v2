import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employeeProfiles } from "@/db/schema/profiles";
import { stores } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EmployeeSelectorClient } from "./employee-selector-client";


export default async function SelectEmployeePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const activeStoreId = (session.session as unknown as { activeStoreId?: string }).activeStoreId;
  if (!activeStoreId) {
    redirect("/select-store");
  }

  // Get store info
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, activeStoreId),
  });

  if (!store) {
    redirect("/select-store");
  }

  // Get active employee profiles for this store
  const profiles = await db
    .select({
      id: employeeProfiles.id,
      name: employeeProfiles.name,
      role: employeeProfiles.role,
      image: employeeProfiles.image,
    })
    .from(employeeProfiles)
    .where(
      and(
        eq(employeeProfiles.storeId, activeStoreId),
        eq(employeeProfiles.isActive, true)
      )
    )
    .orderBy(employeeProfiles.name);

  return (
    <EmployeeSelectorClient
      profiles={profiles}
      storeName={store.name}
      ownerName={session.user.name}
    />
  );
}
