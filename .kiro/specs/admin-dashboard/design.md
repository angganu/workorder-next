# Design Document: Admin Dashboard

## Overview

Admin Dashboard adalah aplikasi web berbasis Next.js yang menyediakan antarmuka manajemen konten dan akun pengguna. Sistem ini mencakup autentikasi lengkap (login, register, lupa password), manajemen profil, dan operasi CRUD penuh untuk konten blog.

Stack teknologi:
- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: MySQL dengan Prisma ORM
- **Auth**: JWT disimpan di HTTP-only cookies
- **File Upload**: Local storage di `/public/uploads`

---

## Architecture

Aplikasi menggunakan arsitektur monolitik Next.js dengan pemisahan yang jelas antara layer UI, API, dan data.

```mermaid
graph TD
    Browser -->|HTTP Request| NextJS[Next.js App Router]
    NextJS -->|Server Components| UI[UI Layer]
    NextJS -->|API Routes| API[API Layer]
    API -->|Prisma Client| DB[(MySQL Database)]
    API -->|File System| FS[/public/uploads]
    UI -->|fetch/axios| API
```

**Keputusan Desain**: Menggunakan Next.js App Router karena mendukung Server Components untuk rendering awal yang cepat dan Route Handlers untuk API endpoints, sehingga tidak perlu backend terpisah.

---

## Components and Interfaces

### Auth Components

| Komponen | Path | Deskripsi |
|---|---|---|
| `LoginForm` | `app/(auth)/login/page.tsx` | Form login dengan validasi |
| `RegisterForm` | `app/(auth)/register/page.tsx` | Form registrasi akun baru |
| `ForgotPasswordForm` | `app/(auth)/forgot-password/page.tsx` | Form request reset password |
| `ResetPasswordForm` | `app/(auth)/reset-password/page.tsx` | Form set password baru via token |

### Dashboard Components

| Komponen | Path | Deskripsi |
|---|---|---|
| `DashboardLayout` | `app/(dashboard)/layout.tsx` | Layout dengan sidebar dan header |
| `Sidebar` | `components/Sidebar.tsx` | Navigasi utama |
| `Header` | `components/Header.tsx` | Header dengan info user dan logout |
| `StatsCard` | `components/StatsCard.tsx` | Kartu statistik (total, published, unpublished) |

### Blog Components

| Komponen | Path | Deskripsi |
|---|---|---|
| `BlogTable` | `components/blog/BlogTable.tsx` | Tabel blog dengan sort, filter, pagination, dan info total/halaman |
| `BlogForm` | `components/blog/BlogForm.tsx` | Form tambah/edit blog (reusable) |
| `BlogDetail` | `app/(dashboard)/blogs/[id]/page.tsx` | Halaman detail blog dengan semua field dan tombol kembali |
| `DeleteDialog` | `components/blog/DeleteDialog.tsx` | Dialog konfirmasi hapus |
| `StatusBadge` | `components/blog/StatusBadge.tsx` | Badge published/unpublished |

### Profile Components

| Komponen | Path | Deskripsi |
|---|---|---|
| `ProfileForm` | `app/(dashboard)/account/page.tsx` | Form update profil (name, email) dengan pre-fill data saat ini |
| `ChangePasswordForm` | `components/account/ChangePasswordForm.tsx` | Form ubah password (current, new, confirm) |
| `AvatarUpload` | `components/account/AvatarUpload.tsx` | Komponen upload foto profil |

### API Routes

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/profile
PUT    /api/profile
PUT    /api/profile/password
POST   /api/profile/avatar

GET    /api/blogs          (query: search, dateFrom, dateTo, sortBy, sortOrder, page)
                           (response includes: data[], total, page, pageSize, totalPages)
POST   /api/blogs
GET    /api/blogs/[id]
PUT    /api/blogs/[id]
DELETE /api/blogs/[id]
PATCH  /api/blogs/[id]/status
```

### Middleware

`middleware.ts` di root project menangani proteksi route:
- Route `/dashboard/*` dan `/api/*` (kecuali `/api/auth/*`) memerlukan JWT yang valid
- Jika tidak ada token atau token invalid → redirect ke `/login`

**Keputusan Desain**: Menggunakan Next.js Middleware untuk proteksi route karena berjalan di Edge Runtime sebelum request mencapai halaman, sehingga tidak ada flash of unauthenticated content.

---

## Data Models

### Prisma Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  avatar    String?
  created_at DateTime @default(now())
  updated_at DateTime @updated_at

  passwordResets PasswordReset[]
}

model Blog {
  id        Int          @id @default(autoincrement())
  judul     String
  deskripsi String       @db.Text
  gambar    String?
  kategori  BlogKategori
  status    BlogStatus   @default(unpublished)
  created_at DateTime     @default(now())
  updated_at DateTime     @updated_at
}

model PasswordReset {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  expiresAt DateTime
  created_at DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

enum BlogKategori {
  sport
  art
  news
  education
}

enum BlogStatus {
  published
  unpublished
}
```

**Keputusan Desain**: Menggunakan Prisma ORM karena menyediakan type-safety penuh, migrasi database yang terkelola, dan query builder yang ekspresif untuk MySQL.

> Schema ini memenuhi Requirement 13: field `Blog` dan `User` sesuai persis dengan spesifikasi data model (Req 13.1 dan 13.2). Field `gambar` dan `avatar` bersifat nullable (`String?`) sesuai kebutuhan.

### JWT Payload

```typescript
interface JWTPayload {
  userId: number;
  email: string;
  name: string;
}
```

Token disimpan di HTTP-only cookie bernama `auth_token` dengan `SameSite=Strict` dan `Secure=true` di production.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid credentials produce authenticated session

*For any* valid user credentials (email + password), calling the login endpoint should return a response that sets an HTTP-only cookie containing a valid JWT token.

**Validates: Requirements 1.1, 1.4**

---

### Property 2: Invalid credentials are rejected

*For any* credential pair where the email does not exist or the password does not match, the Auth_Service should return an error response and not set an auth cookie.

**Validates: Requirements 1.2**

---

### Property 3: Protected routes reject unauthenticated requests

*For any* protected route (dashboard pages, non-auth API routes), a request without a valid auth cookie should receive a redirect to the login page (HTTP 302) or a 401 response.

**Validates: Requirements 1.3**

---

### Property 4: Logout invalidates session

*For any* authenticated session, calling the logout endpoint should result in the auth cookie being cleared, and subsequent requests with the old cookie should be rejected.

**Validates: Requirements 1.5**

---

### Property 5: Registration creates a user with hashed password

*For any* valid registration input (name, email, password ≥ 8 chars), the Auth_Service should create a user record where the stored password field is not equal to the plaintext password (i.e., it is hashed).

**Validates: Requirements 2.1, 2.5**

---

### Property 6: Duplicate email registration is rejected

*For any* email that already exists in the database, attempting to register with that same email should return an error response and not create a new user record.

**Validates: Requirements 2.2**

---

### Property 7: Password length validation

*For any* password string with fewer than 8 characters, both the registration and password change endpoints should reject the input with a validation error.

**Validates: Requirements 2.3, 2.4, 6.3**

---

### Property 8: Password reset with invalid/expired token is rejected

*For any* token string that is not present in the database or has an `expiresAt` timestamp in the past, the reset-password endpoint should return an error response.

**Validates: Requirements 3.5**

---

### Property 9: Password reset round-trip

*For any* registered user, requesting a password reset and submitting a new password via the generated token should result in the user being able to log in with the new password and not the old one.

**Validates: Requirements 3.1, 3.4**

---

### Property 10: Dashboard statistics are consistent with database state

*For any* set of blog records in the database, the dashboard statistics endpoint should return counts where: `total = published + unpublished`, and each count matches the actual count of records with that status.

**Validates: Requirements 4.1**

---

### Property 11: Blog search filter correctness

*For any* keyword string and list of blogs, the search filter should return only blogs where the `judul` or `deskripsi` contains the keyword (case-insensitive), and no blog that does not contain the keyword should appear in the results.

**Validates: Requirements 7.2**

---

### Property 12: Blog date range filter correctness

*For any* date range `[from, to]` and list of blogs, the date filter should return only blogs where `created_at` falls within the range `[from, to]` inclusive.

**Validates: Requirements 7.3**

---

### Property 13: Blog sort correctness

*For any* list of blogs sorted by a given column in ascending order, each element should be ≤ the next element for that column; in descending order, each element should be ≥ the next.

**Validates: Requirements 7.4**

---

### Property 14: Pagination size invariant

*For any* page of blog results (except possibly the last page), the number of returned entries should be exactly 10.

**Validates: Requirements 7.5, 7.6**

---

### Property 15: New blog defaults to unpublished

*For any* valid blog creation request, the created blog record should have `status = "unpublished"` regardless of any status field provided in the request body.

**Validates: Requirements 8.3**

---

### Property 16: Blog form validation rejects missing required fields

*For any* blog submission (create or edit) where one or more of `judul`, `deskripsi`, or `kategori` is missing or empty, the Blog_Service should return a validation error and not create or modify any database record.

**Validates: Requirements 8.4, 9.3**

---

### Property 17: Image upload type validation

*For any* file upload where the MIME type is not one of `image/jpeg`, `image/png`, `image/gif`, `image/webp`, the system should reject the upload with a validation error.

**Validates: Requirements 8.5**

---

### Property 18: Blog update persists changes

*For any* existing blog and valid update payload, after calling the update endpoint the blog record in the database should reflect the new values for all updated fields.

**Validates: Requirements 9.2**

---

### Property 19: Publish/unpublish toggle round-trip

*For any* blog, publishing it then unpublishing it should return the blog to `status = "unpublished"`, and unpublishing then publishing should return it to `status = "published"`.

**Validates: Requirements 10.1, 10.2**

---

### Property 20: Blog deletion is permanent

*For any* blog that has been deleted via the delete endpoint, querying the database for that blog's ID should return no record.

**Validates: Requirements 11.2**

---

### Property 21: Cancelled deletion preserves record

*For any* blog, if the delete action is cancelled (i.e., the delete API is never called), the blog record should remain unchanged in the database.

**Validates: Requirements 11.3**

---

### Property 22: Profile update persists changes

*For any* authenticated user and valid profile update payload (name, email), after calling the update endpoint the user record in the database should reflect the new values.

**Validates: Requirements 5.1**

---

### Property 23: Password change round-trip

*For any* user, after successfully changing the password, the user should be able to log in with the new password and the old password should be rejected.

**Validates: Requirements 6.1**

---

### Property 24: Incorrect current password is rejected on change

*For any* password change request where the provided current password does not match the stored hash, the Profile_Service should return an error and not update the password.

**Validates: Requirements 6.2**

---

### Property 25: Mismatched password confirmation is rejected

*For any* password change request where `newPassword !== confirmPassword`, the Profile_Service should return a validation error before attempting any database operation.

**Validates: Requirements 6.4**

---

### Property 26: Unregistered email on forgot password is rejected

*For any* email string that does not correspond to an existing user record, the Auth_Service should return an error response and not create a password reset token.

**Validates: Requirements 3.2**

---

### Property 27: Duplicate email on profile update is rejected

*For any* profile update request where the submitted email is already associated with a different user account, the Profile_Service should return an error response and not update the user record.

**Validates: Requirements 5.2**

---

### Property 28: Blog detail page displays all required fields

*For any* existing blog record, the detail page should display all fields: judul, deskripsi, gambar, kategori, status, and tanggal dibuat.

**Validates: Requirements 12.1**

---

### Property 29: Pagination metadata correctness

*For any* set of blog records and a given page, the response should include the total number of entries and the current page range (e.g., "1–10 of 42"), where the range accurately reflects the records returned.

**Validates: Requirements 7.7**

---

## Error Handling

### HTTP Status Codes

| Situasi | Status Code |
|---|---|
| Sukses dengan data | 200 OK |
| Resource dibuat | 201 Created |
| Validasi gagal | 400 Bad Request |
| Tidak terautentikasi | 401 Unauthorized |
| Tidak diizinkan | 403 Forbidden |
| Resource tidak ditemukan | 404 Not Found |
| Email sudah terdaftar | 409 Conflict |
| Server error | 500 Internal Server Error |

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;        // Pesan error yang human-readable
  field?: string;       // Field yang menyebabkan error (untuk validasi)
  code?: string;        // Error code untuk client-side handling
}
```

### Validasi

Semua input divalidasi menggunakan **Zod** di API layer sebelum menyentuh database. Ini memastikan type-safety dan pesan error yang konsisten.

**Keputusan Desain**: Zod dipilih karena integrasi yang mulus dengan TypeScript dan kemampuan untuk mendefinisikan schema yang digunakan baik untuk validasi runtime maupun type inference.

---

## Testing Strategy

### Dual Testing Approach

Pengujian menggunakan dua pendekatan yang saling melengkapi:

1. **Unit Tests** — memverifikasi contoh spesifik, edge case, dan kondisi error
2. **Property-Based Tests** — memverifikasi properti universal yang berlaku untuk semua input

### Testing Stack

- **Unit & Integration Tests**: [Jest](https://jestjs.io/) + [Testing Library](https://testing-library.com/) untuk komponen React
- **Property-Based Tests**: [fast-check](https://fast-check.io/) — library PBT untuk TypeScript/JavaScript
- **API Tests**: Jest dengan `node-mocks-http` untuk testing Route Handlers secara terisolasi
- **Database Tests**: Prisma dengan database MySQL test terpisah (atau SQLite in-memory untuk CI)

### Property-Based Test Configuration

Setiap property test dikonfigurasi dengan minimum **100 iterasi** menggunakan `fc.assert` dari fast-check.

Format anotasi untuk setiap test:
```typescript
// Feature: admin-dashboard, Property N: <property_text>
it('should ...', () => {
  fc.assert(
    fc.property(/* arbitraries */, (input) => {
      // test body
    }),
    { numRuns: 100 }
  );
});
```

### Unit Test Focus Areas

- Validasi form (Zod schemas)
- Rendering komponen dengan data yang diketahui
- Edge case: string kosong, nilai null/undefined, boundary values
- Kondisi error: token expired, email tidak ditemukan, dll.

### Property Test Focus Areas

Setiap properti di bagian Correctness Properties di atas diimplementasikan sebagai satu property-based test. Generator (arbitrary) dirancang untuk menghasilkan input yang realistis dan mencakup edge case secara otomatis.

Contoh generator untuk blog:
```typescript
const blogArbitrary = fc.record({
  judul: fc.string({ minLength: 1, maxLength: 255 }),
  deskripsi: fc.string({ minLength: 1 }),
  kategori: fc.constantFrom('sport', 'art', 'news', 'education'),
});
```
