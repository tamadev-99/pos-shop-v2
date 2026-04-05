"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface LogoutButtonProps {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ variant = "ghost", className, children }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Gagal keluar dari akun");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? "Mengeluarkan..." : (children || "Keluar")}
    </Button>
  );
}
