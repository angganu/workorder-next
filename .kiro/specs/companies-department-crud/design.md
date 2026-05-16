# Design Document — Companies & Department CRUD

## Overview

This feature adds full CRUD management for two master data entities: **Companies** (`mst_companies`) and **Departments** (`mst_department`). Both entities follow the same patterns established by the existing Blog CRUD feature: soft delete, active/inactive status toggling, JWT-based authentication via `auth_token` cookie, Zod validation, and Prisma ORM with MySQL.

The feature introduces:
- Two new Prisma models (`MstCompany`, `MstDepartment`)
- Eight new API route groups under `app/api/companies/` and `app/api/department/`
- Two new component folders (`components/company/`, `components/department/`)
- Eight new dashboard pages under `app/dashboard/companies/` and `app/dashboard/department/`
- A sidebar update adding a "Companies" collapsible parent menu with two child links
- A `react-select` AsyncSelect integration in `DepartmentForm` for company lookup

---

## Architecture

The feature slots into the existing Next.js 14 App Router structure without introducing new architectural layers. It reuses every existing utility:

```
lib/prisma.ts        — PrismaClient singleton
lib/jwt.ts           — verifyToken + getUserIdFromRequest pattern
app/api/             — Route Handlers (Node.js runtime)
app/dashboard/       — Server Components (pages) + Client Components (tables/forms)
components/          — Client Components rendered inside Server Component pages
```

### Request Flow

```
Browser
  │
  ├─ Server Component page (app/dashboard/companies/page.tsx)
  │     └─ renders <CompanyTable /> (Client Component)
  │           └─ fetch("/api/companies?...") on mount / filter change
  │                 └─ Route Handler (app/api/companies/route.ts)
  │                       └─ prisma.mstCompany.findMany(...)
  │
  └─ Server Component page (app/dashboard/companies/[id]/page.tsx)
        └─ server-side fetch to /api/companies/[id] with auth_token cookie
              └─ Route Handler → prisma.mstCompany.findUnique(...)
```

The same flow applies to Department pages and API routes.

---

## Components and Interfaces

### Component Tree

```
app/dashboard/layout.tsx
  └─ <Sidebar />                          ← updated with Companies menu
  └─ <DashboardShell>
       ├─ app/dashboard/companies/page.tsx
       │    └─ <CompanyTable />
       ├─ app/dashboard/companies/new/page.tsx
       │    └─ <CompanyForm mode="create" />
       ├─ app/dashboard/companies/[id]/page.tsx
       │    └─ (server-rendered detail view)
       ├─ app/dashboard/companies/[id]/edit/page.tsx
       │    └─ <CompanyForm mode="edit" companyId={id} initialData={...} />
       ├─ app/dashboard/department/page.tsx
       │    └─ <DepartmentTable />
       ├─ app/dashboard/department/new/page.tsx
       │    └─ <DepartmentForm mode="create" />
       ├─ app/dashboard/department/[id]/page.tsx
       │    └─ (server-rendered detail view)
       └─ app/dashboard/department/[id]/edit/page.tsx
            └─ <DepartmentForm mode="edit" departmentId={id} initialData={...} />
```

### Shared Components

| Component | Path | Description |
|---|---|---|
| `ActiveBadge` | `components/company/ActiveBadge.tsx` | Renders "Active" (green) or "Inactive" (gray) pill based on `is_active` value. Shared by both CompanyTable and DepartmentTable. |
| `DeleteDialog` | `components/company/DeleteDialog.tsx` | Confirmation modal before soft delete. Accepts `itemName`, `onConfirm`, `onCancel`, `loading` props. Mirrors `components/blog/DeleteDialog.tsx`. |

### Company Components

| Component | Path | Props |
|---|---|---|
| `CompanyTable` | `components/company/CompanyTable.tsx` | None — fetches own data |
| `CompanyForm` | `components/company/CompanyForm.tsx` | `mode: "create" \| "edit"`, `companyId?: number`, `initialData?: CompanyFormData` |

### Department Components

| Component | Path | Props |
|---|---|---|
| `DepartmentTable` | `components/department/DepartmentTable.tsx` | None — fetches own data |
| `DepartmentForm` | `components/department/DepartmentForm.tsx` | `mode: "create" \| "edit"`, `departmentId?: number`, `initialData?: DepartmentFormData` |

### Interface Definitions

```typescript
// CompanyForm
interface CompanyFormData {
  code: string;
  name: string;
  legal_name: string;
  alias: string;
  description: string;
}

// DepartmentForm
interface DepartmentFormData {
  company_id: number | null;
  company_option: { value: number; label: string } | null; // react-select state
  code: string;
  name: string;
  description: string;
  department_level: string;       // stored as string in form, parsed to int on submit
  department_parent_id: string;   // stored as string in form, parsed to int on submit
}

// API list response (both entities)
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Options endpoint response item
interface SelectOption {
  value: number;   // company id
  label: string;   // company name
}
```

---

## Data Models

### Prisma Schema Additions

The following models are appended to `prisma/schema.prisma`:

```prisma
model MstCompany {
  id           Int       @id @default(autoincrement())
  code         String
  name         String
  legal_name   String
  alias        String?
  description  String?   @db.Text
  is_active    Int       @default(1)
  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt
  deleted_at   DateTime?
  created_by   Int?
  updated_by   Int?
  deleted_by   Int?

  departments  MstDepartment[]

  @@map("mst_companies")
}

model MstDepartment {
  id                   Int       @id @default(autoincrement())
  company_id           Int
  code                 String
  name                 String
  description          String?   @db.Text
  department_level     Int?
  department_parent_id Int?
  is_active            Int       @default(1)
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt
  deleted_at           DateTime?
  created_by           Int?
  updated_by           Int?
  deleted_by           Int?

  company  MstCompany @relation(fields: [company_id], references: [id])

  @@map("mst_department")
}
```

**Design decisions:**
- `is_active` uses `Int` (tinyint in MySQL) rather than a Prisma `Boolean` to match the existing column convention in the project and allow direct `1 - is_active` toggle arithmetic.
- `code` uniqueness is enforced at the application layer (not a DB unique constraint) to allow soft-deleted records to share a code with a live record. The API checks for an existing non-deleted record with the same code before creating.
- `description` uses `@db.Text` to allow long text, consistent with `Blog.deskripsi`.
- `MstDepartment.company_id` has a Prisma relation to `MstCompany` so Prisma can include the company in queries (e.g., `include: { company: true }` for the detail page).

---

## API Routes

All routes follow the same structure as `app/api/blogs/`. Every handler:
1. Calls `getUserIdFromRequest(request)` — returns `null` → 401
2. Validates path params / request body
3. Queries Prisma
4. Returns `NextResponse.json(...)`

### Companies API

#### `app/api/companies/route.ts`

| Method | Auth | Description |
|---|---|---|
| GET | Required | List companies with search, sort, pagination |
| POST | Required | Create a new company |

**GET query parameters:**

| Param | Default | Notes |
|---|---|---|
| `page` | `1` | Page number |
| `search` | `""` | Filters `code`, `name`, `legal_name` (contains, case-insensitive) |
| `sortBy` | `created_at` | Allowed: `code`, `name`, `legal_name`, `is_active`, `created_at` |
| `sortOrder` | `desc` | `asc` or `desc` |

**POST Zod schema:**
```typescript
const createCompanySchema = z.object({
  code:        z.string().min(1, "Code wajib diisi"),
  name:        z.string().min(1, "Nama wajib diisi"),
  legal_name:  z.string().min(1, "Legal name wajib diisi"),
  alias:       z.string().optional(),
  description: z.string().optional(),
});
```

Before inserting, the handler checks for an existing non-deleted record with the same `code`. If found, returns HTTP 400 with `{ error: "Code sudah digunakan", field: "code" }`.

#### `app/api/companies/[id]/route.ts`

| Method | Auth | Description |
|---|---|---|
| GET | Required | Fetch single company by ID |
| PUT | Required | Update company fields |
| DELETE | Required | Soft delete (sets `deleted_at`, `deleted_by`) |

**PUT Zod schema:** same fields as `createCompanySchema`.

#### `app/api/companies/[id]/status/route.ts`

| Method | Auth | Description |
|---|---|---|
| PATCH | Required | Toggle `is_active` between 1 and 0 |

Toggle logic:
```typescript
const newStatus = existing.is_active === 1 ? 0 : 1;
await prisma.mstCompany.update({ where: { id }, data: { is_active: newStatus, updated_by: userId } });
```

#### `app/api/companies/options/route.ts`

| Method | Auth | Description |
|---|---|---|
| GET | Required | Return `{ value, label }` array for react-select AsyncSelect |

**GET query parameters:**

| Param | Default | Notes |
|---|---|---|
| `search` | `""` | Filters `name` or `code` (contains) |

Response shape:
```json
[
  { "value": 1, "label": "PT Maju Bersama" },
  { "value": 2, "label": "CV Karya Mandiri" }
]
```

Only returns records where `deleted_at IS NULL` AND `is_active = 1`.

### Department API

#### `app/api/department/route.ts`

| Method | Auth | Description |
|---|---|---|
| GET | Required | List departments with search, sort, pagination |
| POST | Required | Create a new department |

**GET query parameters:** same pattern as companies (`page`, `search`, `sortBy`, `sortOrder`). Allowed sort fields: `code`, `name`, `department_level`, `is_active`, `created_at`.

**POST Zod schema:**
```typescript
const createDepartmentSchema = z.object({
  company_id:           z.number().int().positive("Company wajib dipilih"),
  code:                 z.string().min(1, "Code wajib diisi"),
  name:                 z.string().min(1, "Nama wajib diisi"),
  description:          z.string().optional(),
  department_level:     z.number().int().optional(),
  department_parent_id: z.number().int().optional(),
});
```

#### `app/api/department/[id]/route.ts`

| Method | Auth | Description |
|---|---|---|
| GET | Required | Fetch single department by ID (includes company via `include: { company: true }`) |
| PUT | Required | Update department fields |
| DELETE | Required | Soft delete |

#### `app/api/department/[id]/status/route.ts`

| Method | Auth | Description |
|---|---|---|
| PATCH | Required | Toggle `is_active` between 1 and 0 |

---

## Page Structure

### Companies Pages

| Route | File | Type | Description |
|---|---|---|---|
| `/dashboard/companies` | `app/dashboard/companies/page.tsx` | Server Component | Renders page title, "+ Tambah Company" button, `<CompanyTable />` |
| `/dashboard/companies/new` | `app/dashboard/companies/new/page.tsx` | Server Component | Renders breadcrumb, title, `<CompanyForm mode="create" />` |
| `/dashboard/companies/[id]` | `app/dashboard/companies/[id]/page.tsx` | Server Component | Server-fetches company, renders detail card |
| `/dashboard/companies/[id]/edit` | `app/dashboard/companies/[id]/edit/page.tsx` | Server Component | Server-fetches company, renders `<CompanyForm mode="edit" />` |

### Department Pages

| Route | File | Type | Description |
|---|---|---|---|
| `/dashboard/department` | `app/dashboard/department/page.tsx` | Server Component | Renders page title, "+ Tambah Department" button, `<DepartmentTable />` |
| `/dashboard/department/new` | `app/dashboard/department/new/page.tsx` | Server Component | Renders breadcrumb, title, `<DepartmentForm mode="create" />` |
| `/dashboard/department/[id]` | `app/dashboard/department/[id]/page.tsx` | Server Component | Server-fetches department (with company), renders detail card |
| `/dashboard/department/[id]/edit` | `app/dashboard/department/[id]/edit/page.tsx` | Server Component | Server-fetches department, renders `<DepartmentForm mode="edit" />` |

### Server-Side Data Fetching Pattern

All detail and edit pages use the same pattern as `app/dashboard/blogs/[id]/page.tsx`:

```typescript
// app/dashboard/companies/[id]/page.tsx
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

async function getCompany(id: string) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/companies/${id}`,
    { headers: { Cookie: `auth_token=${token}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = await getCompany(params.id);
  if (!company) notFound();
  // render detail card...
}
```

---

## Sidebar Update

The `navLinks` array in `components/Sidebar.tsx` gains a new entry between "Blogs" and "Administrator":

```typescript
const navLinks: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/dashboard/blogs", label: "Blogs", icon: "✎" },
  {
    label: "Companies",
    icon: "🏢",
    children: [
      { href: "/dashboard/companies", label: "Companies", icon: "🏭" },
      { href: "/dashboard/department", label: "Department", icon: "🗂" },
    ],
  },
  {
    label: "Administrator",
    icon: "⚙",
    children: [
      { href: "/dashboard/users", label: "Users", icon: "👤" },
      { href: "/dashboard/privileges", label: "Privileges", icon: "🔐" },
    ],
  },
];
```

The `hasActiveChild` function already handles this correctly — it checks `pathname.startsWith(item.href)` for each child, so `/dashboard/companies` and `/dashboard/department` paths will activate the "Companies" parent. No logic changes are needed beyond adding the nav item.

---

## react-select AsyncSelect Integration

`DepartmentForm` uses `react-select`'s `AsyncSelect` component to provide a searchable, server-driven company picker.

### Installation

`react-select` is added as a dependency:
```bash
npm install react-select
```

### Usage in DepartmentForm

```typescript
"use client";
import AsyncSelect from "react-select/async";

// Option type
type CompanyOption = { value: number; label: string };

// Load function called by AsyncSelect on mount and on user input
async function loadCompanyOptions(inputValue: string): Promise<CompanyOption[]> {
  const params = new URLSearchParams();
  if (inputValue) params.set("search", inputValue);
  const res = await fetch(`/api/companies/options?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

// Inside DepartmentForm component:
const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(
  initialData?.company_option ?? null
);

<AsyncSelect
  loadOptions={loadCompanyOptions}
  defaultOptions          // loads options on mount without user typing
  value={selectedCompany}
  onChange={(opt) => setSelectedCompany(opt)}
  placeholder="Cari perusahaan..."
  noOptionsMessage={() => "Tidak ada perusahaan ditemukan"}
  loadingMessage={() => "Memuat..."}
  classNamePrefix="react-select"
/>
```

**On form submit**, `selectedCompany?.value` is sent as `company_id` in the POST/PUT body.

**In edit mode**, the page server-fetches the department (which includes the company via Prisma `include`), then passes `company_option: { value: company.id, label: company.name }` as part of `initialData` to `DepartmentForm`. The form initializes `selectedCompany` from this value, so the select is pre-populated.

### Tailwind + react-select Styling

`react-select` uses its own CSS-in-JS by default. To align with the project's Tailwind styling, the `classNamePrefix="react-select"` prop is used and minimal overrides are applied in `globals.css` or via the `styles` prop to match the existing `border border-gray-300 rounded-md` input appearance.

---

## Data Flow

### Create Company

```
User fills CompanyForm → clicks submit
  → client-side Zod-like validation (empty field checks)
  → POST /api/companies { code, name, legal_name, alias, description }
      → getUserIdFromRequest → 401 if no token
      → Zod parse → 400 if invalid
      → check duplicate code → 400 if exists
      → prisma.mstCompany.create({ data: { ...fields, created_by: userId, updated_by: userId } })
      → 201 { message, company }
  → router.push("/dashboard/companies")
```

### Toggle Company Status

```
User clicks status toggle button in CompanyTable
  → PATCH /api/companies/[id]/status
      → getUserIdFromRequest → 401 if no token
      → prisma.mstCompany.findUnique({ where: { id, deleted_at: null } }) → 404 if missing
      → newStatus = existing.is_active === 1 ? 0 : 1
      → prisma.mstCompany.update({ data: { is_active: newStatus, updated_by: userId } })
      → 200 { message, company }
  → CompanyTable calls fetchCompanies() to refresh list
```

### Soft Delete Company

```
User clicks "Hapus" → DeleteDialog appears
User confirms → DELETE /api/companies/[id]
      → getUserIdFromRequest → 401 if no token
      → prisma.mstCompany.findUnique({ where: { id, deleted_at: null } }) → 404 if missing
      → prisma.mstCompany.update({ data: { deleted_at: new Date(), deleted_by: userId } })
      → 200 { message }
  → CompanyTable refreshes list (soft-deleted record no longer appears)
```

### Create Department with AsyncSelect

```
User opens DepartmentForm (create mode)
  → AsyncSelect mounts → loadCompanyOptions("") → GET /api/companies/options
      → returns [{ value: 1, label: "PT Maju" }, ...]
  → User types in AsyncSelect → loadCompanyOptions("maju") → GET /api/companies/options?search=maju
      → returns filtered options
  → User selects a company option
  → User fills code, name, etc. → clicks submit
  → POST /api/department { company_id: selectedCompany.value, code, name, ... }
      → Zod parse → 400 if invalid
      → prisma.mstDepartment.create(...)
      → 201 { message, department }
  → router.push("/dashboard/department")
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search filter correctness

*For any* search query string submitted to `GET /api/companies` or `GET /api/department`, every record in the returned `data` array SHALL contain the search string in at least one of the searchable fields (`code`, `name`, `legal_name` for companies; `code`, `name` for departments).

**Validates: Requirements 4.2, 6.2**

---

### Property 2: Soft-deleted records are excluded from all GET responses

*For any* company or department record that has been soft-deleted (i.e., `deleted_at` is set), that record SHALL NOT appear in the list response (`GET /api/companies` or `GET /api/department`) nor in the single-record response (`GET /api/companies/[id]` or `GET /api/department/[id]`).

**Validates: Requirements 15.2, 5.1, 7.1**

---

### Property 3: Soft delete sets audit fields

*For any* company or department record, after a successful `DELETE /api/companies/[id]` or `DELETE /api/department/[id]` request by an authenticated user, the record in the database SHALL have `deleted_at` set to a non-null timestamp and `deleted_by` equal to the authenticated user's ID.

**Validates: Requirements 15.1, 5.3, 7.3**

---

### Property 4: Status toggle is an involution (round-trip)

*For any* company or department record with any initial `is_active` value, calling `PATCH /api/companies/[id]/status` (or the department equivalent) twice in succession SHALL restore `is_active` to its original value.

**Validates: Requirements 5.4, 7.4**

---

### Property 5: Validation rejects missing required fields

*For any* POST or PUT request to `/api/companies` or `/api/department` that omits or sends an empty value for any required field (`code`, `name`, `legal_name` for companies; `company_id`, `code`, `name` for departments), the API SHALL return HTTP 400 with a non-empty `error` string and a `field` identifier.

**Validates: Requirements 4.6, 4.8, 6.5, 6.7**

---

### Property 6: Unauthenticated requests are always rejected

*For any* endpoint under `/api/companies/**` or `/api/department/**`, a request made without a valid `auth_token` cookie SHALL receive HTTP 401 with `{ "error": "Unauthorized" }`, regardless of the HTTP method or request body.

**Validates: Requirements 16.1, 4.7, 6.6, 8.3**

---

### Property 7: Options endpoint returns only active, non-deleted companies

*For any* call to `GET /api/companies/options`, every item in the returned array SHALL correspond to a company where `deleted_at IS NULL` AND `is_active = 1`. No inactive or soft-deleted company SHALL appear in the options list.

**Validates: Requirements 8.1**

---

### Property 8: Options search filter correctness

*For any* search query string submitted to `GET /api/companies/options?search=...`, every item in the returned array SHALL have a `name` or `code` that contains the search string (case-insensitive).

**Validates: Requirements 8.2**

---

### Property 9: Soft-deleted records reject modification

*For any* company or department record that has been soft-deleted, subsequent `PUT`, `PATCH`, or `DELETE` requests targeting that record's ID SHALL return HTTP 404.

**Validates: Requirements 15.3, 5.6, 7.6**

---

### Property 10: Paginated response structure is always valid

*For any* valid GET list request to `/api/companies` or `/api/department`, the response SHALL always contain all five required fields (`data`, `total`, `page`, `pageSize`, `totalPages`), and `data.length` SHALL be less than or equal to `pageSize`, and `total` SHALL equal the count of non-deleted records matching the current filter.

**Validates: Requirements 4.1, 6.1**

---

## Error Handling

### API Layer

All route handlers wrap their logic in `try/catch`. Unhandled errors return HTTP 500 with `{ "error": "Terjadi kesalahan server" }` and log to `console.error`.

| Scenario | HTTP Status | Response Body |
|---|---|---|
| Missing/invalid auth token | 401 | `{ "error": "Unauthorized" }` |
| Non-integer `[id]` param | 400 | `{ "error": "ID tidak valid" }` |
| Zod validation failure | 400 | `{ "error": "<message>", "field": "<fieldName>" }` |
| Duplicate `code` on create | 400 | `{ "error": "Code sudah digunakan", "field": "code" }` |
| Record not found / soft-deleted | 404 | `{ "error": "Company tidak ditemukan" }` or `{ "error": "Department tidak ditemukan" }` |
| Unhandled server error | 500 | `{ "error": "Terjadi kesalahan server" }` |

### Frontend Layer

Both `CompanyForm` and `DepartmentForm` handle errors as follows:

- **Field-level errors**: When the API returns `{ error, field }`, the error message is displayed below the corresponding input using `fieldError` state.
- **General errors**: When the API returns `{ error }` without a `field`, the message is shown in a red banner at the top of the form.
- **Network errors**: A `catch` block sets a generic "Terjadi kesalahan server" message.
- **Loading state**: The submit button is disabled and shows a spinner while `loading === true`.

Both table components (`CompanyTable`, `DepartmentTable`) display inline error messages when fetch, delete, or status-toggle operations fail.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and error conditions:

- **Zod schemas**: Test that valid payloads pass and invalid payloads (missing fields, wrong types) fail with the correct error messages.
- **`getUserIdFromRequest`**: Test with valid token, expired token, and missing cookie.
- **`ActiveBadge`**: Snapshot test for `is_active = 1` and `is_active = 0`.
- **`DeleteDialog`**: Example test verifying confirm/cancel callbacks fire correctly.
- **Sidebar `navLinks`**: Example test verifying "Companies" appears after "Blogs" and has the correct children.

### Property-Based Tests

Property-based tests use **fast-check** (the standard PBT library for TypeScript/JavaScript) configured to run a minimum of **100 iterations** per property.

Each property test is tagged with a comment in the format:
```
// Feature: companies-department-crud, Property N: <property_text>
```

**Property 1 — Search filter correctness**
Generate random search strings and a seeded database of companies/departments. Assert that every record in the response contains the search string in the appropriate fields.

**Property 2 — Soft-deleted records excluded**
Generate random company/department records, soft-delete a random subset, then assert none of the deleted records appear in list or single-record GET responses.

**Property 3 — Soft delete sets audit fields**
Generate random authenticated user IDs and company/department records. After DELETE, assert `deleted_at` is set and `deleted_by` equals the user ID.

**Property 4 — Status toggle round-trip**
Generate random companies/departments with random initial `is_active` values. Toggle twice and assert the final value equals the initial value.

**Property 5 — Validation rejects missing required fields**
Generate random payloads with one or more required fields removed or set to empty string. Assert every such payload returns HTTP 400 with `error` and `field`.

**Property 6 — Unauthenticated requests rejected**
Generate random request bodies and paths. Assert that requests without a valid `auth_token` always return 401.

**Property 7 — Options returns only active non-deleted companies**
Generate a mix of active, inactive, and soft-deleted companies. Assert the options endpoint never returns inactive or deleted ones.

**Property 8 — Options search filter correctness**
Generate random search strings and company datasets. Assert every returned option's `name` or `code` contains the search string.

**Property 9 — Soft-deleted records reject modification**
Generate soft-deleted records and random PUT/PATCH/DELETE requests. Assert all return 404.

**Property 10 — Paginated response structure**
Generate random page numbers and filter combinations. Assert the response always has all five required fields and `data.length <= pageSize`.

### Integration Tests

Integration tests (using a test database or Prisma mock) cover:

- Full create → read → update → delete lifecycle for both entities.
- Department creation with a valid `company_id` foreign key.
- Attempting to create a department with a non-existent `company_id`.
- Pagination boundary conditions (last page, empty result set).
