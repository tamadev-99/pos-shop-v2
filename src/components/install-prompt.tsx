"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Only show on mobile/tablet — skip desktop
        const isMobileOrTablet =
            /android|iphone|ipad|ipod|mobile|tablet/i.test(navigator.userAgent) ||
            ("ontouchstart" in window && window.innerWidth < 1024);
        if (!isMobileOrTablet) return;

        // Check if already installed (standalone mode)
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        if (standalone) return;

        // Check if dismissed recently (don't show again for 3 days)
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            const threeDays = 3 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedAt < threeDays) return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // iOS doesn't fire beforeinstallprompt, show manual instructions
            setShowPrompt(true);
            return;
        }

        // Listen for the beforeinstallprompt event (Chrome/Edge/Android)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md animate-slide-up">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/90 via-gray-900/95 to-gray-950/95 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
                {/* Glow effect */}
                <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-500/15 blur-2xl" />

                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                    aria-label="Tutup"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
                        <Smartphone size={22} className="text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pr-4">
                        <h3 className="text-sm font-semibold text-white">
                            Install Noru POS
                        </h3>
                        {isIOS ? (
                            <p className="mt-0.5 text-xs leading-relaxed text-white/60">
                                Tap tombol{" "}
                                <span className="inline-flex items-center rounded bg-white/10 px-1 py-0.5 text-[10px] font-medium text-white/80">
                                    Bagikan ↑
                                </span>{" "}
                                lalu pilih{" "}
                                <span className="font-medium text-white/80">
                                    &quot;Tambahkan ke Layar Utama&quot;
                                </span>
                            </p>
                        ) : (
                            <p className="mt-0.5 text-xs leading-relaxed text-white/60">
                                Akses kasir lebih cepat langsung dari layar utama HP Anda
                            </p>
                        )}
                    </div>
                </div>

                {/* Install button (non-iOS only) */}
                {!isIOS && (
                    <button
                        onClick={handleInstall}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98]"
                    >
                        <Download size={16} />
                        Install Sekarang
                    </button>
                )}
            </div>

            <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
        </div>
    );
}
