# Dokumentasi: Sistem Langganan & Integrasi Mayar

Sistem ini menggunakan **Next.js 16**, **Drizzle ORM**, dan **Mayar** untuk mengelola langganan POS secara otomatis.

## 1. Persiapan Environment Variables

Salin variabel berikut ke file `.env` (lokal) dan ke **Vercel Dashboard > Settings > Environment Variables** (produksi):

```bash
# Database (Supabase / Postgres)
DATABASE_URL="postgres://..."

# Auth (Better-Auth)
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:3000" # Ubah ke domain Vercel saat deploy

# Mayar Payment Gateway
MAYAR_API_KEY="your_mayar_api_key"
MAYAR_WEBHOOK_SECRET="your_webhook_secret_from_mayar"
```

## 2. Cara Kerja Langganan

1. **Trial 14 Hari**: Setiap tenant baru otomatis mendapatkan status `trial`. Tanggal berakhir dihitung 14 hari dari waktu pembuatan tenant.
2. **Dashboard Blocking**: File `src/app/(dashboard)/layout.tsx` akan memeriksa status setiap kali user masuk ke dashboard. Jika `now > expiry_date`, user akan diarahkan ke `/subscription`.
3. **Pembayaran Pro**: User diarahkan ke halaman `/subscription` yang berisi tombol pembayaran Rp 100.000 via Mayar.
4. **Webhook Perpanjangan**: Saat pembayaran sukses, Mayar mengirim `POST` ke `/api/webhooks/mayar`. Sistem akan menambahkan **30 hari** ke masa aktif tenant yang bersangkutan.

## 3. Konfigurasi Webhook di Dashboard Mayar

1. Masuk ke Dashboard Mayar.
2. Navigasi ke menu **Developer > Webhooks**.
3. Tambahkan URL Webhook:
   - **Local Testing**: Gunakan `ngrok` untuk membuat tunnel ke localhost (e.g., `https://xyz.ngrok.io/api/webhooks/mayar`).
   - **Production**: `https://PROJECT-ANDA.vercel.app/api/webhooks/mayar`
4. Pilih event: `payment.success` atau sejenisnya.
5. Pastikan **Metadata** yang dikirim saat pembuatan invoice menyertakan `tenantId`.

## 4. Peran Super Admin

Satu user dengan role `saas-admin` (default: `admin@noru.com`) memiliki akses ke menu **Platform Admin** di sidebar untuk:
- Melihat daftar semua tenant.
- Memantau status langganan (Trial, Active, Expired).
- Melihat estimasi pendapatan total dari tenant aktif.

## 5. Deployment ke Vercel

1. **Push ke GitHub**: Pastikan semua kode terbaru sudah di-push.
2. **Koneksi Database**: Pastikan koneksi database di Vercel bisa mengakses DB Supabase (gunakan `DATABASE_URL` yang tepat).
3. **Migrasi**: Jalankan `npm run db:push` dari komputer lokal ke database produksi sebelum deploy ke Vercel agar skema tabel `tenants` terbaru (dengan status langganan) sudah tersedia.
