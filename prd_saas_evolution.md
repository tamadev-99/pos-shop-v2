# Product Requirement Document (PRD): POS SaaS Multi-Tenant Platform

## 1. Ringkasan Eksekutif
Proyek ini bertujuan untuk mentransformasi aplikasi POS (Point of Sale) yang ada menjadi platform **SaaS (Software as a Service) Multi-tenant**. Platform ini akan memungkinkan pemilik bisnis (Owner) untuk mendaftar, mengelola satu atau lebih toko (Store), dan mengelola profil karyawan yang dapat mengakses sistem POS menggunakan mekanisme PIN yang aman.

## 2. Persona Pengguna
| Persona | Deskripsi | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Owner (Tenant Admin)** | Pemilik bisnis yang berlangganan layanan SaaS. | Pendaftaran, manajemen toko, manajemen karyawan, pengaturan hak akses, melihat laporan. |
| **Employee (Karyawan)** | Staf yang bekerja di toko (Kasir, Manager). | Melakukan transaksi penjualan, manajemen stok (sesuai akses), login via PIN. |

## 3. Fitur Utama

### 3.1. Landing Page (SaaS Portal)
- Halaman publik untuk memasarkan layanan POS.
- Informasi fitur, paket harga, dan testimoni.
- Tombol "Daftar Sekarang" untuk Owner.

### 3.2. Multi-Tenant Architecture
- Pemisahan data antar Owner (Tenant). Data satu Owner tidak boleh terlihat oleh Owner lain.
- Identifikasi tenant menggunakan `tenant_id` di setiap tabel terkait.

### 3.3. Store Management & Configuration
- Owner dapat membuat dan mengelola beberapa cabang/toko dalam satu akun.
- Setiap toko memiliki inventaris dan pengaturan yang terisolasi.
- **Store Type Selection**: Owner dapat menyetel jenis toko (**Clothing Store** atau **Mini Mart**).
  - **Clothing Store Mode**: Mengaktifkan fitur varian produk (Size, Color, Brand).
  - **Mini Mart Mode**: Mengaktifkan fitur barcode scanning yang dioptimalkan dan manajemen stok (Expiry Date, Batch number).

### 3.4. Flexible Product Schema
- Sistem akan menyesuaikan input data produk berdasarkan jenis toko yang dipilih.
- Atribut dinamis untuk mendukung kebutuhan spesifik masing-masing industri tanpa mengganti basis kode.

### 3.5. Employee Profile & PIN Authentication
- **Employee List**: Setelah Owner memilih toko, sistem menampilkan daftar profil karyawan yang bertugas di toko tersebut.
- **PIN-based Login**: Karyawan masuk ke sistem POS dengan memilih profil mereka dan memasukkan PIN (**tepat 6 angka**).
- **Fast Profile Switching**: Memungkinkan pergantian shift atau petugas kasir dengan cepat tanpa logout akun Owner.

### 3.6. Role-Based Access Control (RBAC)
- Owner dapat menentukan "Hak Akses" (Permissions) untuk setiap peran (misal: Kasir tidak bisa melakukan Void atau melihat laporan laba).
- Menu dan fitur di dalam POS akan muncul/hilang berdasarkan hak akses profil yang sedang aktif.

### 3.7. Audit Logging & Activity Tracking
- Setiap aktivitas di POS (penjualan, pembatalan, perubahan harga, buka laci kasir) akan dicatat.
- Log mencakup: Waktu, Jenis Aktivasi, Detail, dan **Profil Karyawan** yang melakukan.

## 4. Alur Pengguna (User Flow)

### 4.1. Alur Owner
1. Owner mengunjungi **Landing Page** -> Klik **Login/Register**.
2. Setelah login, Owner diarahkan ke **Store Selector Page**.
3. Owner dapat menambah Toko baru dan memilih **Store Type** (Clothing/Mini Mart). Pilihan ini bersifat **permanen** setelah toko dibuat.
4. Owner memilih Toko yang ingin dikelola/dioperasikan.
5. Owner masuk ke **Dashboard Admin** (untuk manajemen) atau **POS System**.

### 4.2. Alur Karyawan (Di Sistem POS)
1. Layanan POS menampilkan **Profil Karyawan** (setelah Store dipilih).
2. Tampilan POS menyesuaikan dengan **Store Type** (misal: tampilan grid untuk Clothing, fokus scanner untuk Mini Mart).
3. Karyawan memilih **Nama/Foto Profil** mereka.
4. Karyawan memasukkan **PIN**.
5. Jika PIN benar, masuk ke Dashboard POS dengan fitur terbatas sesuai hak akses.
6. Semua transaksi yang dibuat otomatis tersimpan dengan `created_by_employee_id`.

## 5. Rencana Arsitektur Data (Proposed Schema Updates)

### 5.1. Tabel Baru / Perubahan
- **`tenants`**: Menyimpan data perusahaan/bisnis Owner.
- **`stores`**: Menyimpan detail cabang (id, name, address, tenant_id, **store_type**).
- **`employee_profiles`**: Menyimpan profil karyawan (name, role_id, pin_hash, store_id).
- **`permissions`**: Definisi hak akses (view_reports, manage_inventory, perform_void, etc).
- **`audit_logs`**: Logging aktivitas (action, metadata, employee_id, store_id).
- **`product_variants`**: Disediakan khusus untuk tipe **Clothing Store**.

---

## 6. Verifikasi & Pengujian
- **Tenant Isolation**: Memastikan user A tidak bisa mengakses data user B via modifikasi URL/API.
- **Type-specific UI**: Memastikan elemen UI yang relevan (misal: Pemilih Ukuran) hanya muncul jika tipe toko adalah Clothing.
- **PIN Security**: Validasi brute-force protection untuk input PIN.
- **RBAC Enforcement**: Memastikan API endpoint memvalidasi permission karyawan, bukan hanya login status.

## 7. Tahapan Pengembangan (Roadmap)
1. **Fase 1**: Refactor database ke Multi-tenant & Migrasi data lama.
2. **Fase 2**: Implementasi Landing Page & Auth Flow (Login -> Store Selector).
3. **Fase 3**: Fitur Manajemen Tipe Toko (Clothing/Mini Mart) & Skema Produk Dinamis.
4. **Fase 4**: Fitur Employee Profile & PIN Lock System.
5. **Fase 5**: Sistem RBAC & Dashboard Manajemen Perizinan.
6. **Fase 6**: Audit Logging & Reporting Analytics per Karyawan.
