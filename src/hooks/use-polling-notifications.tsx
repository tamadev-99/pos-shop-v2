"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getUnreadNotificationsForPolling } from "@/lib/actions/notifications";
import { useAuth } from "@/components/providers/auth-provider";
import { AlertCircle, FileText, Bell, CreditCard, Gift } from "lucide-react";

export function usePollingNotifications(intervalMs = 15000) { // Default 15 seconds
    const { user } = useAuth();

    // Keep track of which notifications have been toasted in this session
    // Using a ref so we don't trigger re-renders
    const toastedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Only poll if user is logged in
        if (!user) return;

        const poll = async () => {
            try {
                const unreadNotifs = await getUnreadNotificationsForPolling();

                unreadNotifs.forEach((notif) => {
                    if (!toastedIds.current.has(notif.id)) {
                        // New unread notification! Toast it!

                        // Pick an icon based on type
                        let icon;
                        switch (notif.type) {
                            case "stok_rendah":
                                icon = <AlertCircle size={ 20 } className = "text-rose-500" />;
                                break;
                            case "pesanan_baru":
                                icon = <FileText size={ 20 } className = "text-amber-500" />;
                                break;
                            case "pembayaran":
                                icon = <CreditCard size={ 20 } className = "text-emerald-500" />;
                                break;
                            case "promo":
                                icon = <Gift size={ 20 } className = "text-violet-500" />;
                                break;
                            case "sistem":
                            default:
                                icon = <Bell size={ 20 } className = "text-blue-500" />;
                        }

                        const isUrgent = notif.priority === "urgent" || notif.priority === "high";

                        toast(notif.title, {
                            description: notif.message,
                            icon: icon,
                            duration: isUrgent ? Infinity : 5000,
                        });

                        // Mark as toasted so we don't show it again in this session
                        toastedIds.current.add(notif.id);
                    }
                });
            } catch (error) {
                console.error("Failed to poll notifications:", error);
            }
        };

        // Initial poll
        poll();

        // Set up interval
        const intervalId = setInterval(poll, intervalMs);

        // Cleanup
        return () => clearInterval(intervalId);
    }, [user, intervalMs]);
}
