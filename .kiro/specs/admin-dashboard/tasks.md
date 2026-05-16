# Implementation Plan: Admin Dashboard

## Overview

Implementasi Admin Dashboard Next.js secara bertahap, dimulai dari fondasi (project setup, database, auth), lalu dashboard & profil, kemudian fitur blog lengkap.

## Tasks

- [x] 1. Setup project dan infrastruktur dasar
  - Inisialisasi project Next.js 14 dengan App Router dan Tailwind CSS
  - Setup Prisma dengan koneksi MySQL, buat schema (`User`, `Blog`, `PasswordReset`, enums)
  - Install dependencies: `jsonwebtoken`, `bcryptjs`, `zod`, `fast-check`, `jest`, `@testing-library/react`, `node-mocks-http`
  - Buat folder struktur: `app/(auth)`, `app/(dashboard)`, `components/blog`, `components/account`, `lib`
  - _Requirements: 13.1, 13.2_

- [x] 2. Implementasi Auth API dan Middleware
  - [x] 2.1 Buat helper JWT (`lib/jwt.ts`): `signToken`, `verifyToken` dengan payload `{ userId, email, name }`
    - _Requirements: 1.4_
  - [x] 2.2 Buat `middleware.ts` untuk proteksi route `/dashboard/*` dan `/api/*` (kecuali `/api/auth/*`)
    - Redirect ke `/login` jika token tidak ada atau invalid
    - _Requirements: 1.3_
  - [x] 2.3 Tulis property test untuk middleware (Property 3)
    - **Property 3: Protected routes reject unauthenticated requests**
    - **Validates: Requirements 1.3**
  - [x] 2.4 Implementasi `POST /api/auth/login`: validasi Zod, cek email+password, set HTTP-only cookie `auth_token`
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 2.5 Tulis property test untuk login (Property 1 & 2)
    - **Property 1: Valid credentials produce authenticated session**
    - **Property 2: Invalid credentials are rejected**
    - **Validates: Requirements 1.1, 1.2, 1.4**
  - [x] 2.6 Implementasi `POST /api/auth/logout`: clear cookie `auth_token`
    - _Requirements: 1.5_
  - [x] 2.7 Tulis property test untuk logout (Property 4)
    - **Property 4: Logout invalidates session**
    - **Validates: Requirements 1.5**
  - [x] 2.8 Implementasi `POST /api/auth/register`: validasi Zod (password ≥ 8 chars), hash password dengan bcrypt, cek duplikat email, buat user
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.9 Tulis property test untuk register (Property 5, 6, 7)
    - **Property 5: Registration creates a user with hashed password**
    - **Property 6: Duplicate email registration is rejected**
    - **Property 7: Password length validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  - [x] 2.10 Implementasi `POST /api/auth/forgot-password`: cek email terdaftar, buat token reset, simpan ke `PasswordReset` dengan `expiresAt`
    - _Requirements: 3.1, 3.2_
  - [x] 2.11 Tulis property test untuk forgot password (Property 26)
    - **Property 26: Unregistered email on forgot password is rejected**
    - **Validates: Requirements 3.2**
  - [x] 2.12 Implementasi `POST /api/auth/reset-password`: validasi token (ada & belum expired), update password, hapus token
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 2.13 Tulis property test untuk reset password (Property 8 & 9)
    - **Property 8: Password reset with invalid/expired token is rejected**
    - **Property 9: Password reset round-trip**
    - **Validates: Requirements 3.4, 3.5**

- [x] 3. Checkpoint — Pastikan semua test auth lulus, tanya user jika ada pertanyaan.

- [x] 4. Implementasi halaman Auth (UI)
  - [x] 4.1 Buat `app/(auth)/login/page.tsx` dengan `LoginForm`: input email+password, validasi client-side, submit ke `/api/auth/login`, redirect ke dashboard
    - _Requirements: 1.1, 1.2_
  - [x] 4.2 Buat `app/(auth)/register/page.tsx` dengan `RegisterForm`: input name+email+password, validasi, submit ke `/api/auth/register`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 4.3 Buat `app/(auth)/forgot-password/page.tsx` dengan `ForgotPasswordForm`
    - _Requirements: 3.1, 3.2_
  - [x] 4.4 Buat `app/(auth)/reset-password/page.tsx` dengan `ResetPasswordForm` (baca token dari query param)
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 5. Implementasi Dashboard Layout dan halaman utama
  - [x] 5.1 Buat `app/(dashboard)/layout.tsx` (`DashboardLayout`) dengan `Sidebar` dan `Header`
    - `Sidebar`: link ke Dashboard, Blogs, Account
    - `Header`: tampilkan nama user dan avatar dari JWT/session, tombol logout
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 5.2 Buat `components/StatsCard.tsx` dan halaman `app/(dashboard)/page.tsx`
    - Fetch dari `/api/dashboard/stats` (atau inline server component), tampilkan total, published, unpublished
    - _Requirements: 4.1_
  - [x] 5.3 Buat `GET /api/dashboard/stats`: query count blog berdasarkan status
    - _Requirements: 4.1_
  - [x] 5.4 Tulis property test untuk dashboard stats (Property 10)
    - **Property 10: Dashboard statistics are consistent with database state**
    - **Validates: Requirements 4.1**

- [x] 6. Implementasi Profile API dan halaman Account
  - [x] 6.1 Implementasi `GET /api/profile`: kembalikan data user dari JWT
    - _Requirements: 5.3_
  - [x] 6.2 Implementasi `PUT /api/profile`: validasi Zod, cek duplikat email (user lain), update name+email
    - _Requirements: 5.1, 5.2_
  - [x] 6.3 Tulis property test untuk profile update (Property 22 & 27)
    - **Property 22: Profile update persists changes**
    - **Property 27: Duplicate email on profile update is rejected**
    - **Validates: Requirements 5.1, 5.2**
  - [x] 6.4 Implementasi `POST /api/profile/avatar`: terima file upload, validasi MIME type, simpan ke `/public/uploads`, update field `avatar`
    - _Requirements: 5.4, 8.5_
  - [x] 6.5 Tulis property test untuk image upload validation (Property 17)
    - **Property 17: Image upload type validation**
    - **Validates: Requirements 8.5**
  - [x] 6.6 Implementasi `PUT /api/profile/password`: validasi current password, cek konfirmasi, hash & update
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 6.7 Tulis property test untuk password change (Property 7, 23, 24, 25)
    - **Property 23: Password change round-trip**
    - **Property 24: Incorrect current password is rejected on change**
    - **Property 25: Mismatched password confirmation is rejected**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [x] 6.8 Buat halaman `app/(dashboard)/account/page.tsx` dengan `ProfileForm`, `ChangePasswordForm`, dan `AvatarUpload`
    - Pre-fill form dengan data user saat ini
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [x] 7. Checkpoint — Pastikan semua test profile lulus, tanya user jika ada pertanyaan.

- [x] 8. Implementasi Blog API
  - [x] 8.1 Implementasi `GET /api/blogs`: query dengan filter `search`, `dateFrom`, `dateTo`, sort `sortBy`/`sortOrder`, pagination `page` (10 per halaman), kembalikan `{ data, total, page, pageSize, totalPages }`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [x] 8.2 Tulis property test untuk blog list (Property 11, 12, 13, 14, 29)
    - **Property 11: Blog search filter correctness**
    - **Property 12: Blog date range filter correctness**
    - **Property 13: Blog sort correctness**
    - **Property 14: Pagination size invariant**
    - **Property 29: Pagination metadata correctness**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
  - [x] 8.3 Implementasi `POST /api/blogs`: validasi Zod (judul, deskripsi, kategori required), set status default `unpublished`
    - _Requirements: 8.2, 8.3, 8.4_
  - [x] 8.4 Tulis property test untuk blog creation (Property 15 & 16)
    - **Property 15: New blog defaults to unpublished**
    - **Property 16: Blog form validation rejects missing required fields**
    - **Validates: Requirements 8.3, 8.4**
  - [x] 8.5 Implementasi `GET /api/blogs/[id]`: kembalikan satu blog atau 404
    - _Requirements: 12.1_
  - [x] 8.6 Implementasi `PUT /api/blogs/[id]`: validasi Zod, update fields, handle image replacement
    - _Requirements: 9.2, 9.3, 9.4_
  - [x] 8.7 Tulis property test untuk blog update (Property 18)
    - **Property 18: Blog update persists changes**
    - **Validates: Requirements 9.2**
  - [x] 8.8 Implementasi `PATCH /api/blogs/[id]/status`: toggle status published/unpublished
    - _Requirements: 10.1, 10.2_
  - [x] 8.9 Tulis property test untuk publish toggle (Property 19)
    - **Property 19: Publish/unpublish toggle round-trip**
    - **Validates: Requirements 10.1, 10.2**
  - [x] 8.10 Implementasi `DELETE /api/blogs/[id]`: hapus record dari database
    - _Requirements: 11.2_
  - [x] 8.11 Tulis property test untuk blog deletion (Property 20)
    - **Property 20: Blog deletion is permanent**
    - **Validates: Requirements 11.2**

- [x] 9. Implementasi Blog UI
  - [x] 9.1 Buat `components/blog/StatusBadge.tsx` dan `components/blog/DeleteDialog.tsx`
    - _Requirements: 10.3, 11.1, 11.3_
  - [x] 9.2 Buat `components/blog/BlogTable.tsx`: tabel dengan kolom judul, kategori, status, tanggal, aksi; search input, date range filter, sort header, pagination controls, info total/halaman
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [x] 9.3 Buat `components/blog/BlogForm.tsx`: form reusable untuk tambah/edit (judul, deskripsi, gambar upload, kategori select)
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 9.1, 9.3, 9.4_
  - [x] 9.4 Buat halaman `app/(dashboard)/blogs/page.tsx`: render `BlogTable`, tombol "Tambah Blog"
    - _Requirements: 7.1, 8.1_
  - [x] 9.5 Buat halaman `app/(dashboard)/blogs/new/page.tsx`: render `BlogForm` untuk tambah blog baru
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 9.6 Buat halaman `app/(dashboard)/blogs/[id]/edit/page.tsx`: fetch blog, render `BlogForm` pre-filled untuk edit
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 9.7 Buat halaman `app/(dashboard)/blogs/[id]/page.tsx` (`BlogDetail`): tampilkan semua field blog, tombol kembali ke list
    - _Requirements: 12.1, 12.2_
  - [x] 9.8 Tulis unit test untuk BlogDetail (Property 28)
    - **Property 28: Blog detail page displays all required fields**
    - **Validates: Requirements 12.1**

- [x] 10. Checkpoint final — Pastikan semua test lulus, tanya user jika ada pertanyaan.

## Notes

- Setiap task mereferensikan requirement spesifik untuk traceability
- Property tests menggunakan fast-check dengan minimum 100 iterasi (`numRuns: 100`)
- Unit tests menggunakan Jest + Testing Library untuk komponen React
- API tests menggunakan `node-mocks-http` untuk testing Route Handlers secara terisolasi
