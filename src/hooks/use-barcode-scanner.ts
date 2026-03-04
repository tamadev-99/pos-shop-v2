"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook that detects barcode scanner input (keyboard wedge mode).
 * USB/Bluetooth barcode scanners type characters rapidly (<50ms between keys)
 * and end with Enter. This hook distinguishes scanner input from manual typing.
 */
export function useBarcodeScanner(
    onScan: (barcode: string) => void,
    options?: { enabled?: boolean; minLength?: number; maxDelay?: number }
) {
    const { enabled = true, minLength = 4, maxDelay = 80 } = options || {};
    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resetBuffer = useCallback(() => {
        bufferRef.current = "";
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea (except search input)
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

            // Allow scanner input even when focused on the search input
            // Scanner sends chars very quickly (<maxDelay ms between keystrokes)
            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            // If too much time passed, reset buffer
            if (timeSinceLastKey > maxDelay) {
                bufferRef.current = "";
            }

            // Enter key = potential end of barcode
            if (e.key === "Enter") {
                if (bufferRef.current.length >= minLength) {
                    e.preventDefault();
                    e.stopPropagation();
                    const barcode = bufferRef.current.trim();
                    bufferRef.current = "";
                    onScan(barcode);
                    return;
                }
                bufferRef.current = "";
                return;
            }

            // Only accumulate printable single characters
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // If this is rapid input (scanner-like), prevent default on input fields
                if (isInput && timeSinceLastKey < maxDelay && bufferRef.current.length > 2) {
                    e.preventDefault();
                }
                bufferRef.current += e.key;
            }

            // Auto-clear buffer after a delay (if user stops typing)
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                bufferRef.current = "";
            }, 500);
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [enabled, minLength, maxDelay, onScan]);

    return { resetBuffer };
}
