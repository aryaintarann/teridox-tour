# Architecture — Tour Booking Platform (Single Vendor)

## 1. Tech Stack


| Layer                   | Teknologi                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| Frontend + API          | Next.js (App Router), full-stack (React + API routes)             |
| Auth, Database, Storage | Supabase (PostgreSQL, Supabase Auth, Supabase Storage)            |
| Payment gateway         | DOKU                                                              |
| Translate otomatis      | Google Cloud Translation API (atau DeepL API)                     |
| Notifikasi WhatsApp     | Fonnte                                                            |
| Notifikasi Email        | Resend (atau Laravel Mail digantikan Resend karena stack Next.js) |
| Deployment              | Vercel (frontend + API routes), Supabase Cloud (backend service)  |


Alasan pemilihan ada di riwayat diskusi proyek — ringkasnya: full Next.js + Supabase dipilih untuk kecepatan development MVP dengan infra minimal, tetap di atas PostgreSQL (Supabase) sehingga constraint &amp; row-level locking untuk mencegah double-booking tetap tersedia.

## 2. Diagram Arsitektur (Tingkat Tinggi)

```
[Browser: Customer / Admin]
        │
        ▼
   Next.js (Vercel)
   ├─ Halaman customer (SSR/ISR untuk SEO)
   ├─ Halaman admin (protected route)
   └─ API Routes
        ├─ /api/bookings        → Supabase (RPC anti double-booking)
        ├─ /api/webhooks/doku   → verifikasi & update status pembayaran
        ├─ /api/translate       → Google Translate API
        ├─ /api/notify/wa       → Fonnte
        └─ /api/notify/email    → Resend
        │
        ▼
     Supabase
     ├─ Auth (customer & admin)
     ├─ PostgreSQL (data utama)
     └─ Storage (foto paket)
        │
        ▼
   DOKU (payment gateway, redirect/callback)

```

## 3. Skema Database (Ringkas)

**users** (dari Supabase Auth + tabel profil tambahan `profiles`)

- id, email, full\_name, phone, role (`customer` | `admin`), preferred\_lang, created\_at

**packages**

- id, slug, title\_id, title\_en, description\_id, description\_en, duration\_hours, price, capacity, category, cover\_image\_url, is\_active, created\_by, created\_at

**package\_itinerary**

- id, package\_id (FK), time\_label, title\_id, title\_en, desc\_id, desc\_en, sort\_order

**package\_images**

- id, package\_id (FK), image\_url, sort\_order

**availability**

- id, package\_id (FK), date, is\_blocked, slots\_total, slots\_booked
- constraint UNIQUE(package\_id, date) — mencegah entri ganda per tanggal

**bookings**

- id, user\_id (FK), package\_id (FK), booking\_date, participants, pickup\_location, notes, status (`pending`|`paid`|`confirmed`|`cancelled`|`completed`), total\_price, booking\_code (unique), created\_at

**payments**

- id, booking\_id (FK), doku\_transaction\_id (unique), method, amount, status (`pending`|`success`|`failed`), raw\_payload (JSONB), created\_at, updated\_at

**notifications\_log**

- id, booking\_id (FK), channel (`email`|`wa`), type, status, sent\_at

## 4. Logika Anti Double-Booking

Ditangani lewat Postgres function (RPC), bukan logika di client:

1. Saat booking dibuat, panggil RPC `create_booking(package_id, date, participants)`
2. RPC melakukan `SELECT ... FOR UPDATE` pada baris `availability` terkait sebelum increment `slots_booked`
3. Jika `slots_booked >= slots_total` setelah lock, transaksi dibatalkan dan API mengembalikan error "tanggal penuh"
4. Baru setelah RPC berhasil, baris `bookings` dibuat dengan status `pending`

## 5. Alur Pembayaran (DOKU)

1. Booking dibuat dengan status `pending` → redirect ke halaman pembayaran DOKU
2. DOKU mengirim callback/webhook ke `/api/webhooks/doku`
3. Endpoint verifikasi signature dari DOKU, cek `doku_transaction_id` di tabel `payments` — jika sudah pernah diproses (status bukan `pending`), abaikan (idempotent)
4. Jika valid &amp; baru: update `payments.status`, lalu update `bookings.status` menjadi `paid`
5. Trigger notifikasi email &amp; WA ke pelanggan dan admin

## 6. Autentikasi &amp; Otorisasi

- Supabase Auth untuk register/login pelanggan (email/password)
- Role `admin` disimpan di tabel `profiles`, dicek di middleware Next.js untuk melindungi route `/admin/*`
- Row Level Security (RLS) di Supabase: pelanggan hanya bisa akses booking miliknya sendiri; admin punya akses penuh lewat service role di server-side API routes

## 7. Translate Otomatis (Admin)

1. Admin submit form paket dalam Bahasa Indonesia
2. API route `/api/translate` memanggil Google Translate API untuk field `title`, `description`, `itinerary`
3. Hasil terjemahan ditampilkan sebagai draft yang bisa diedit admin sebelum disimpan ke `title_en`/`description_en`

## 8. Keamanan

- Semua secret (DOKU key, Google Translate key, Fonnte token, Resend key) disimpan sebagai environment variable di Vercel, tidak pernah di client
- Webhook DOKU divalidasi dengan signature/HMAC sesuai dokumentasi DOKU sebelum diproses
- RLS aktif di semua tabel Supabase yang memuat data pelanggan

## 9. Deployment

- Frontend + API routes: Vercel (auto-deploy dari branch main)
- Database/Auth/Storage: Supabase Cloud
- Environment terpisah untuk staging &amp; production (project Supabase berbeda, env var Vercel berbeda)

