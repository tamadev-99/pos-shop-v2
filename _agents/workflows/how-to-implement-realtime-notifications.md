---
description: Cara Mengimplementasikan Notifikasi Real-time (SSE) di Next.js App Router
---

# Workflow: Implementasi Notifikasi Real-time (Ide #18)

Sistem notifikasi real-time sangat mungkin diterapkan pada arsitektur pos-v2 saat ini. Karena ini adalah proyek Next.js, metode yang paling sederhana dan ringan (tanpa perlu library eksternal atau layanan pihak ketiga seperti Pusher) adalah menggunakan **Server-Sent Events (SSE)**.

Berikut adalah langkah-langkah detail untuk mengimplementasikannya:

## 1. Buat SSE Route Handler di Server
// turbo
Buat API route khusus yang akan membiarkan koneksi tetap terbuka untuk mengirim event (streaming) ke client.
Tujuan: `src/app/api/notifications/stream/route.ts`

- Rute ini harus me-return `new Response(stream, { headers })` dengan header `Content-Type: text/event-stream`, `Cache-Control: no-cache`, dan `Connection: keep-alive`.
- Saat ada client terhubung, server bisa mem-push pesan dengan format: `data: {"type": "NEW_NOTIF", ...}\n\n`.

## 2. Buat Event Emitter atau Pub/Sub
Karena Next.js App Router bersifat stateless per-request (beda instance request handle), Anda butuh cara untuk berkomunikasi antar request (misal: saat `createOrder` dijalankan dan stok habis, harus bisa trigger rute SSE untuk mengirim pesan).
- Jika deploy di 1 server VPS (PM2/Node), bisa gunakan `EventEmitter` node JS global.
- Jika deploy di serverless (Vercel), gunakan **Redis Pub/Sub** (opsional tapi lebih robust).
- Untuk versi sederhana (MVP internal), kita bisa gunakan polling berbasis interval di dalam route SSE API.

## 3. Buat Custom Hook di Client
// turbo
Buat hook React untuk mendengarkan SSE.
Tujuan: `src/hooks/use-sse-notifications.ts`

```tsx
import { useEffect } from "react";
import { toast } from "sonner";

export function useSSENotifications() {
  useEffect(() => {
    // Buka koneksi SSE
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_notification") {
        // Tampilkan toast ke kasir!
        toast.warning(data.title, { description: data.message });
      }
    };

    return () => eventSource.close();
  }, []);
}
```

## 4. Pasang Hook di Layout Utama
Pasang `useSSENotifications()` di dalam komponen yang selalu dirender (seperti `Header` atau layout dashboard utama).
Ini memastikan selama kasir membuka halaman POS, notifikasi "Stok Habis" akan otomatis muncul tanpa harus refresh halaman.

## 5. Integrasi ke Logika Aplikasi
Update server actions yang ada (terutama `checkLowStock` di `src/lib/actions/notifications.ts` dan di bagian validasi transaksi).
Saat sebuah notifikasi baru di-insert ke tabel `notifications`, trigger event Pub/Sub atau pastikan SSE route menangkap perubahan ini (misalnya dengan mengecek DB setiap 5 detik di dalam loop SSE).

---
### Rekomendasi Arsitektur untuk MVP:
Untuk memulai, karena ini aplikasi Next.js standar, gunakan **pendekatan SSE + Short Polling di dalam EventStream**. Artinya:
1. Client konek ke `/api/notifications/stream`
2. Server membuat streaming response
3. Server mengecek tabel DB `notifications` yang `isRead: false` setiap 5 detik.
4. Jika ada pesan baru yang belum dikirim sejak last_check, tulis/kirim string `data: {"contoh": "stok habis"}`.
5. Client menangkap dan memunculkan notifikasi UI toast dan update ikon bel (Notification Badge).
