"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeStoreId: string | null;
  activeEmployeeProfileId: string | null;
  activeEmployeeName: string | null;
  activeEmployeeRole: string | null;
  setActiveEmployee: (name: string | null, role: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  activeStoreId: null,
  activeEmployeeProfileId: null,
  activeEmployeeName: null,
  activeEmployeeRole: null,
  setActiveEmployee: () => {},
});

export function AuthProvider({ 
  children,
  initialEmployeeName = null,
  initialEmployeeRole = null,
}: { 
  children: ReactNode;
  initialEmployeeName?: string | null;
  initialEmployeeRole?: string | null;
}) {
  const { data: session, isPending } = useSession();
  const [activeEmployeeName, setActiveEmployeeName] = useState<string | null>(initialEmployeeName);
  const [activeEmployeeRole, setActiveEmployeeRole] = useState<string | null>(initialEmployeeRole);

  useEffect(() => {
    setActiveEmployeeName(initialEmployeeName);
    setActiveEmployeeRole(initialEmployeeRole);
  }, [initialEmployeeName, initialEmployeeRole]);

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as Record<string, unknown>).role as string || "cashier",
        image: session.user.image,
      }
    : null;

  const sessionData = session?.session as Record<string, unknown> | undefined;
  const activeStoreId = (sessionData?.activeStoreId as string) || null;
  const activeEmployeeProfileId = (sessionData?.activeEmployeeProfileId as string) || null;

  const setActiveEmployee = (name: string | null, role: string | null) => {
    setActiveEmployeeName(name);
    setActiveEmployeeRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        isAuthenticated: !!session,
        activeStoreId,
        activeEmployeeProfileId,
        activeEmployeeName,
        activeEmployeeRole,
        setActiveEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
