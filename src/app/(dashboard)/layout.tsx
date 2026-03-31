import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getRolePermissions } from "@/lib/actions/permissions";
import { getSessionContext } from "@/lib/actions/store-context";
import { getSubscriptionStatus } from "@/lib/actions/subscription";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rolePermissions = await getRolePermissions();
  const subStatus = await getSubscriptionStatus();

  // Total Blocking: Redirect if subscription/trial is expired
  if (subStatus.isBlocked) {
    redirect("/subscription");
  }

  let initialEmployeeName = null;
  let initialEmployeeRole = null;
  
  try {
    const context = await getSessionContext();
    if (context.activeEmployeeProfileId) {
      initialEmployeeName = context.userName;
      initialEmployeeRole = context.userRole;
    }
  } catch (error) {
    // If not authenticated, the middleware will catch this anyway, 
    // or we just gracefully ignore so client-side can handle it.
  }

  return (
    <AuthProvider 
      initialEmployeeName={initialEmployeeName} 
      initialEmployeeRole={initialEmployeeRole}
    >
      <div className="flex h-dvh overflow-hidden">
        <Sidebar customPermissions={rolePermissions} />
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
