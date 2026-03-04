"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScanBarcode, Search, AlertCircle, CheckCircle2, Camera, CameraOff, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

type ScanMode = "manual" | "camera";

interface BarcodeScannerDialogProps {
    open: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
    lastResult?: { success: boolean; message: string } | null;
}

export function BarcodeScannerDialog({
    open,
    onClose,
    onScan,
    lastResult,
}: BarcodeScannerDialogProps) {
    const [manualInput, setManualInput] = useState("");
    const [mode, setMode] = useState<ScanMode>("manual");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<any>(null);

    // Cleanup camera on close or mode change
    const stopCamera = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                const state = html5QrCodeRef.current.getState();
                // State 2 = SCANNING
                if (state === 2) {
                    await html5QrCodeRef.current.stop();
                }
            } catch {
                // Ignore stop errors
            }
            try {
                html5QrCodeRef.current.clear();
            } catch {
                // Ignore clear errors
            }
            html5QrCodeRef.current = null;
        }
        setScanning(false);
    }, []);

    // Start camera scanning
    const startCamera = useCallback(async () => {
        setCameraError(null);

        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!scannerRef.current) return;

        const scannerId = "barcode-camera-scanner";

        // Make sure the container has the right id
        scannerRef.current.id = scannerId;

        try {
            const scanner = new Html5Qrcode(scannerId);
            html5QrCodeRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" }, // Back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 100 },
                    aspectRatio: 1.5,
                },
                (decodedText: string) => {
                    // On successful scan
                    onScan(decodedText);
                },
                () => {
                    // QR scan failure — ignore (continuous scanning)
                }
            );
            setScanning(true);
        } catch (err: any) {
            setCameraError(
                err?.message?.includes("Permission")
                    ? "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser."
                    : "Tidak bisa mengakses kamera. Pastikan kamera tersedia."
            );
            setScanning(false);
        }
    }, [onScan]);

    // Handle mode switch
    useEffect(() => {
        if (!open) {
            stopCamera();
            return;
        }

        if (mode === "camera") {
            // Small delay for DOM to render
            const timer = setTimeout(() => startCamera(), 300);
            return () => clearTimeout(timer);
        } else {
            stopCamera();
            // Focus manual input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, mode, startCamera, stopCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualInput.trim();
        if (code.length >= 4) {
            onScan(code);
            setManualInput("");
            inputRef.current?.focus();
        }
    };

    const handleClose = () => {
        stopCamera();
        setMode("manual");
        setCameraError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} className="max-w-sm">
            <DialogClose onClose={handleClose} />
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ScanBarcode size={18} className="text-accent" />
                    Barcode Scanner
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex rounded-xl bg-surface border border-border p-1 gap-1">
                    <button
                        onClick={() => setMode("manual")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                            mode === "manual"
                                ? "bg-accent text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Keyboard size={14} />
                        Manual
                    </button>
                    <button
                        onClick={() => setMode("camera")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                            mode === "camera"
                                ? "bg-accent text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Camera size={14} />
                        Kamera
                    </button>
                </div>

                {/* Camera Mode */}
                {mode === "camera" && (
                    <div className="space-y-3">
                        {/* Camera viewport */}
                        <div className="relative rounded-xl overflow-hidden bg-black border border-border min-h-[200px]">
                            <div ref={scannerRef} className="w-full" />
                            {!scanning && !cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Camera size={28} className="text-muted-foreground animate-pulse mb-2" />
                                    <p className="text-xs text-muted-foreground">Memulai kamera...</p>
                                </div>
                            )}
                        </div>

                        {cameraError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                                <CameraOff size={14} className="shrink-0" />
                                <span>{cameraError}</span>
                            </div>
                        )}

                        {scanning && (
                            <p className="text-[10px] text-muted-foreground text-center">
                                📸 Arahkan kamera ke barcode — scan otomatis
                            </p>
                        )}
                    </div>
                )}

                {/* Manual Mode */}
                {mode === "manual" && (
                    <div className="space-y-3">
                        <div className="rounded-xl bg-surface border border-border p-4 text-center space-y-2">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                                <ScanBarcode size={28} className="text-accent animate-pulse" />
                            </div>
                            <p className="text-xs font-medium text-foreground">
                                Siap menerima input barcode
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                Arahkan barcode scanner USB atau ketik kode manual
                            </p>
                        </div>

                        <form onSubmit={handleManualSubmit} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                placeholder="Ketik/paste kode barcode..."
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                autoFocus
                            />
                            <Button type="submit" size="sm" disabled={manualInput.trim().length < 4}>
                                <Search size={14} />
                            </Button>
                        </form>
                    </div>
                )}

                {/* Last Scan Feedback */}
                {lastResult && (
                    <div
                        className={cn(
                            "flex items-center gap-2 p-3 rounded-lg text-xs",
                            lastResult.success
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                        )}
                    >
                        {lastResult.success ? (
                            <CheckCircle2 size={14} className="shrink-0" />
                        ) : (
                            <AlertCircle size={14} className="shrink-0" />
                        )}
                        <span>{lastResult.message}</span>
                    </div>
                )}

                {/* Tip */}
                <p className="text-[10px] text-muted-dim text-center">
                    💡 Scanner USB/Bluetooth juga otomatis terdeteksi tanpa buka dialog ini
                </p>
            </div>
        </Dialog>
    );
}
