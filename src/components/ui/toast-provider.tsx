"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "rgba(15, 16, 25, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "#f0f2f5",
          fontSize: "13px",
        },
        classNames: {
          success: "!border-emerald-500/20",
          error: "!border-rose-500/20",
          warning: "!border-amber-500/20",
        },
      }}
    />
  );
}
