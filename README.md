# TeridoxTour

Booking tour single-vendor. Spesifikasi: [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md).

## Setup

1. `pnpm install`, lalu `cp .env.example .env.local` dan isi nilainya.
2. Buat project Supabase, jalankan `supabase/migrations/0001_init.sql` lalu (opsional) `supabase/seed.sql` di SQL Editor.
3. Supabase Auth > URL Configuration: Site URL = `NEXT_PUBLIC_SITE_URL`, tambahkan `<site>/auth/callback` ke Redirect URLs.
4. Daftar lewat `/register`, lalu jadikan admin:
   `update public.profiles set role = 'admin' where email = 'anda@email.com';`
5. DOKU Back Office: set Notification URL ke `<site>/api/webhooks/doku` (harus URL publik; untuk lokal pakai tunnel seperti ngrok).
6. `pnpm dev` → http://localhost:3000 (admin: `/admin/login`).

## Perintah

- `pnpm check` : self-check signature DOKU
- `pnpm build` : build + type-check

## Catatan

- Integrasi (DOKU, Google Translate, Resend, Fonnte) dilewati dengan aman bila kuncinya kosong; hanya pembayaran yang wajib dikonfigurasi agar booking bisa dibayar.
- Reminder H-1 & pembersihan booking belum dibayar berjalan via Vercel Cron (`vercel.json`), butuh `CRON_SECRET`.
- Foto paket di seed memakai placeholder picsum. Ganti lewat admin.
