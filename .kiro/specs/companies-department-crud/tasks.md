# Implementation Plan: Companies & Department CRUD

## Overview

Implement full CRUD management for `MstCompany` and `MstDepartment` master data entities. The implementation follows the existing Blog CRUD pattern: Prisma + MySQL, JWT auth via `auth_token` cookie, Zod validation, soft delete, and Next.js 14 App Router with Server Component pages and Client Component tables/forms. A `react-select` AsyncSelect is used in `DepartmentForm` for the company picker.

---

## Tasks

- [x] 1. Add Prisma models and run migration
  - [x] 1.1 Add `MstCompany` and `MstDepartment` models to `prisma/schema.prisma`
    - Append the `MstCompany` model mapped to `@@map("mst_companies")` with fields: `id`, `code`, `name`, `legal_name`, `alias?`, `description? @db.Text`, `is_active Int @default(1)`, `created_at`, `updated_at @updatedAt`, `deleted_at?`, `created_by?`, `updated_by?`, `deleted_by?`, and `departments MstDepartment[]` relation
    - Append the `MstDepartment` model mapped to `@@map("mst_department")` with fields: `id`, `company_id Int`, `code`, `name`, `description? @db.Text`, `department_level Int?`, `department_parent_id Int?`, `is_active Int @default(1)`, `created_at`, `updated_at @updatedAt`, `deleted_at?`, `created_by?`, `updated_by?`, `deleted_by?`, and `company MstCompany @relation(fields: [company_id], references: [id])`
    - _Requirements: 2.1, 3.1, 3.2_

  - [x] 1.2 Run Prisma migration
    - Run `npx prisma migrate dev --name add_mst_company_and_department` to create the `mst_companies` and `mst_department` tables
    - Run `npx prisma generate` to regenerate the Prisma client
    - _Requirements: 2.1, 3.1_

- [x] 2. Install react-select
  - [x] 2.1 Install the `react-select` package
    - Run `npm install react-select` to add the dependency
    - _Requirements: 13.2_

- [x] 3. Create shared components in `components/company/`
  - [x] 3.1 Create `components/company/ActiveBadge.tsx`
    - Accept a single prop `is_active: number`
    - Render a green pill "Active" when `is_active === 1`, gray pill "Inactive" otherwise
    - Mirror the style of `components/blog/StatusBadge.tsx` using `inline-flex rounded-full text-xs font-medium` Tailwind classes
    - _Requirements: 9.6, 12.6_

  - [x] 3.2 Create `components/company/DeleteDialog.tsx`
    - Accept props: `itemName: string`, `onConfirm: () => void`, `onCancel: () => void`, `loading?: boolean`
    - Render a fixed overlay modal with confirm/cancel buttons, mirroring `components/blog/DeleteDialog.tsx`
    - Use `itemName` in the confirmation message instead of a hardcoded entity name
    - _Requirements: 9.7, 12.7_

- [x] 4. Implement Companies API routes
  - [x] 4.1 Create `app/api/companies/route.ts` (GET list + POST create)
    - Implement `getUserIdFromRequest` using the same `auth_token` cookie + `verifyToken` pattern as `app/api/blogs/route.ts`
    - Define `createCompanySchema` with Zod: `code` (min 1), `name` (min 1), `legal_name` (min 1), `alias` (optional string), `description` (optional string)
    - **GET**: parse `page`, `search`, `sortBy` (allowed: `code`, `name`, `legal_name`, `is_active`, `created_at`), `sortOrder`; filter `deleted_at: null`; search across `code`, `name`, `legal_name` with `contains`; return `{ data, total, page, pageSize: 10, totalPages }`
    - **POST**: validate with `createCompanySchema`; check for existing non-deleted record with same `code` → 400 `{ error: "Code sudah digunakan", field: "code" }`; create with `created_by` and `updated_by` set to `userId`; return 201
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 16.1, 16.2_

  - [x] 4.2 Create `app/api/companies/[id]/route.ts` (GET + PUT + DELETE)
    - **GET**: parse `id`, return non-deleted company or 404 `{ error: "Company tidak ditemukan" }`
    - **PUT**: validate with same schema as create; update fields + `updated_by`; return updated record
    - **DELETE**: soft delete — set `deleted_at: new Date()` and `deleted_by: userId`; return 200
    - Return 400 `{ error: "ID tidak valid" }` for non-integer `id`
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 15.1, 15.2, 15.3, 16.1_

  - [x] 4.3 Create `app/api/companies/[id]/status/route.ts` (PATCH toggle)
    - **PATCH**: find non-deleted company; toggle `is_active` with `newStatus = existing.is_active === 1 ? 0 : 1`; update `is_active` and `updated_by`; return updated record
    - _Requirements: 5.4, 15.3, 16.1_

  - [x] 4.4 Create `app/api/companies/options/route.ts` (GET for react-select)
    - **GET**: filter `deleted_at: null` AND `is_active: 1`; accept optional `search` param filtering `name` or `code` with `contains`; return array of `{ value: id, label: name }`
    - _Requirements: 8.1, 8.2, 8.3, 16.1_

  - [x] 4.5 Write property tests for Companies API
    - **Property 1: Search filter correctness** — for any search string, every record in `data` contains the string in `code`, `name`, or `legal_name`
    - **Validates: Requirements 4.2**
    - **Property 2: Soft-deleted records excluded** — soft-deleted records never appear in GET list or GET single responses
    - **Validates: Requirements 15.2, 5.1**
    - **Property 3: Soft delete sets audit fields** — after DELETE, `deleted_at` is non-null and `deleted_by` equals the authenticated user's ID
    - **Validates: Requirements 15.1, 5.3**
    - **Property 4: Status toggle is an involution** — toggling `is_active` twice restores the original value
    - **Validates: Requirements 5.4**
    - **Property 5: Validation rejects missing required fields** — POST/PUT with missing `code`, `name`, or `legal_name` returns HTTP 400 with `error` and `field`
    - **Validates: Requirements 4.6, 4.8**
    - **Property 6: Unauthenticated requests rejected** — any request without valid `auth_token` returns 401
    - **Validates: Requirements 16.1, 4.7**
    - **Property 7: Options returns only active non-deleted companies** — every item from `/api/companies/options` has `deleted_at IS NULL` and `is_active = 1`
    - **Validates: Requirements 8.1**
    - **Property 8: Options search filter correctness** — every returned option's `name` or `code` contains the search string
    - **Validates: Requirements 8.2**
    - **Property 9: Soft-deleted records reject modification** — PUT/PATCH/DELETE on a soft-deleted record returns 404
    - **Validates: Requirements 15.3, 5.6**
    - **Property 10: Paginated response structure** — every GET list response has `data`, `total`, `page`, `pageSize`, `totalPages`; `data.length <= pageSize`
    - **Validates: Requirements 4.1**

- [x] 5. Implement Companies frontend components
  - [x] 5.1 Create `components/company/CompanyTable.tsx`
    - Client component (`"use client"`) that manages its own fetch state
    - State: `companies`, `total`, `page`, `totalPages`, `pageSize`, `search`, `sortBy`, `sortOrder`, `loading`, `error`, `deleteTarget`, `deleteLoading`, `statusLoading`
    - `fetchCompanies` with `useCallback` — builds query params and calls `GET /api/companies`
    - Table columns: No, Code, Name, Legal Name, Status (`<ActiveBadge />`), Created At, Actions
    - Actions per row: "Detail" link, "Edit" link, toggle status button (calls `PATCH /api/companies/[id]/status`), "Hapus" button (opens `<DeleteDialog />`)
    - Sortable column headers with `↕`/`↑`/`↓` indicators; search input; pagination controls (first/prev/next/last)
    - Import `ActiveBadge` from `components/company/ActiveBadge` and `DeleteDialog` from `components/company/DeleteDialog`
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

  - [x] 5.2 Create `components/company/CompanyForm.tsx`
    - Client component with props: `mode: "create" | "edit"`, `companyId?: number`, `initialData?: CompanyFormData`
    - Fields: `code` (text, required), `name` (text, required), `legal_name` (text, required), `alias` (text, optional), `description` (textarea, optional)
    - Client-side empty-field validation before submit
    - POST to `/api/companies` (create) or PUT to `/api/companies/[companyId]` (edit)
    - On success: redirect to `/dashboard/companies` (create) or `/dashboard/companies/[companyId]` (edit)
    - Display field-level errors from `{ error, field }` API response; general error banner for non-field errors
    - Disabled submit button with spinner while `loading === true`; "Batal" button navigates to `/dashboard/companies`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 5.3 Write unit tests for CompanyForm and CompanyTable
    - Test `ActiveBadge` renders "Active" for `is_active=1` and "Inactive" for `is_active=0`
    - Test `DeleteDialog` fires `onConfirm` and `onCancel` callbacks correctly
    - _Requirements: 9.6, 9.7_

- [x] 6. Implement Companies dashboard pages
  - [x] 6.1 Create `app/dashboard/companies/page.tsx`
    - Server Component; render page title "Companies" and `<Link href="/dashboard/companies/new">+ Tambah Company</Link>` button; render `<CompanyTable />`
    - _Requirements: 9.1_

  - [x] 6.2 Create `app/dashboard/companies/new/page.tsx`
    - Server Component; render breadcrumb link back to `/dashboard/companies`, page title "Tambah Company", and `<CompanyForm mode="create" />` inside a white card
    - _Requirements: 10.1, 10.2_

  - [x] 6.3 Create `app/dashboard/companies/[id]/page.tsx`
    - Server Component; server-fetch company via `GET /api/companies/[id]` using `auth_token` cookie (same pattern as `app/dashboard/blogs/[id]/page.tsx`); call `notFound()` if null
    - Display detail card with all fields: code, name, legal_name, alias, description, `<ActiveBadge is_active={company.is_active} />`, created_at
    - Provide "Edit Company" button → `/dashboard/companies/[id]/edit` and "Kembali" button → `/dashboard/companies`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 6.4 Create `app/dashboard/companies/[id]/edit/page.tsx`
    - Server Component; server-fetch company; call `notFound()` if null; render `<CompanyForm mode="edit" companyId={id} initialData={...} />` inside a white card
    - _Requirements: 10.3, 10.4_

- [x] 7. Implement Department API routes
  - [x] 7.1 Create `app/api/department/route.ts` (GET list + POST create)
    - Same structure as `app/api/companies/route.ts`
    - Define `createDepartmentSchema`: `company_id` (z.number().int().positive()), `code` (min 1), `name` (min 1), `description` (optional), `department_level` (z.number().int().optional()), `department_parent_id` (z.number().int().optional())
    - **GET**: allowed sort fields: `code`, `name`, `department_level`, `is_active`, `created_at`; search across `code` and `name`; return paginated response
    - **POST**: validate; check duplicate `code` among non-deleted records; create with `created_by` and `updated_by`; return 201
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 16.1, 16.2_

  - [x] 7.2 Create `app/api/department/[id]/route.ts` (GET + PUT + DELETE)
    - **GET**: return non-deleted department with `include: { company: true }` or 404 `{ error: "Department tidak ditemukan" }`
    - **PUT**: validate with same schema; update fields + `updated_by`; return updated record
    - **DELETE**: soft delete — set `deleted_at` and `deleted_by`; return 200
    - Return 400 for non-integer `id`
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 15.1, 15.2, 15.3, 16.1_

  - [x] 7.3 Create `app/api/department/[id]/status/route.ts` (PATCH toggle)
    - **PATCH**: find non-deleted department; toggle `is_active`; update `updated_by`; return updated record
    - _Requirements: 7.4, 15.3, 16.1_

  - [x] 7.4 Write property tests for Department API
    - **Property 1: Search filter correctness** — every record in `data` contains the search string in `code` or `name`
    - **Validates: Requirements 6.2**
    - **Property 2: Soft-deleted records excluded** — soft-deleted departments never appear in GET responses
    - **Validates: Requirements 15.2, 7.1**
    - **Property 3: Soft delete sets audit fields** — after DELETE, `deleted_at` is non-null and `deleted_by` equals the user's ID
    - **Validates: Requirements 15.1, 7.3**
    - **Property 4: Status toggle is an involution** — toggling `is_active` twice restores the original value
    - **Validates: Requirements 7.4**
    - **Property 5: Validation rejects missing required fields** — POST/PUT with missing `company_id`, `code`, or `name` returns HTTP 400 with `error` and `field`
    - **Validates: Requirements 6.5, 6.7**
    - **Property 6: Unauthenticated requests rejected** — any request without valid `auth_token` returns 401
    - **Validates: Requirements 16.1, 6.6**
    - **Property 9: Soft-deleted records reject modification** — PUT/PATCH/DELETE on a soft-deleted department returns 404
    - **Validates: Requirements 15.3, 7.6**
    - **Property 10: Paginated response structure** — every GET list response has all five required fields; `data.length <= pageSize`
    - **Validates: Requirements 6.1**

- [x] 8. Checkpoint — Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Department frontend components
  - [x] 9.1 Create `components/department/DepartmentTable.tsx`
    - Client component that manages its own fetch state
    - Table columns: No, Code, Name, Company, Department Level, Status (`<ActiveBadge />`), Created At, Actions
    - Actions per row: "Detail" link, "Edit" link, toggle status button (calls `PATCH /api/department/[id]/status`), "Hapus" button (opens `<DeleteDialog />`)
    - Import `ActiveBadge` and `DeleteDialog` from `components/company/`
    - Sortable headers, search input, pagination controls — same pattern as `CompanyTable`
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

  - [x] 9.2 Create `components/department/DepartmentForm.tsx`
    - Client component with props: `mode: "create" | "edit"`, `departmentId?: number`, `initialData?: DepartmentFormData`
    - Fields: `code` (text, required), `name` (text, required), `description` (textarea, optional), `department_level` (number input, optional), `department_parent_id` (number input, optional)
    - `company_id` field: use `AsyncSelect` from `react-select/async` with `loadOptions` calling `GET /api/companies/options?search=[inputValue]`; set `defaultOptions` to load on mount; use `classNamePrefix="react-select"`
    - State: `selectedCompany: CompanyOption | null` initialized from `initialData?.company_option ?? null`
    - On submit: send `company_id: selectedCompany?.value` in POST/PUT body
    - In edit mode: `initialData.company_option` pre-populates the AsyncSelect
    - POST to `/api/department` (create) or PUT to `/api/department/[departmentId]` (edit)
    - On success: redirect to `/dashboard/department` (create) or `/dashboard/department/[departmentId]` (edit)
    - Display field-level and general errors; disabled submit with spinner; "Batal" navigates to `/dashboard/department`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [x] 9.3 Write unit tests for DepartmentForm and DepartmentTable
    - Test that `DepartmentForm` renders the AsyncSelect company field
    - Test that `DepartmentForm` in edit mode pre-populates `selectedCompany` from `initialData.company_option`
    - _Requirements: 13.2, 13.9_

- [x] 10. Implement Department dashboard pages
  - [x] 10.1 Create `app/dashboard/department/page.tsx`
    - Server Component; render page title "Department" and `<Link href="/dashboard/department/new">+ Tambah Department</Link>` button; render `<DepartmentTable />`
    - _Requirements: 12.1_

  - [x] 10.2 Create `app/dashboard/department/new/page.tsx`
    - Server Component; render breadcrumb, page title "Tambah Department", and `<DepartmentForm mode="create" />` inside a white card
    - _Requirements: 13.1, 13.4_

  - [x] 10.3 Create `app/dashboard/department/[id]/page.tsx`
    - Server Component; server-fetch department via `GET /api/department/[id]` (response includes `company` object); call `notFound()` if null
    - Display detail card: code, name, company name (`department.company.name`), description, department_level, department_parent_id, `<ActiveBadge />`, created_at
    - Provide "Edit Department" button → `/dashboard/department/[id]/edit` and "Kembali" button → `/dashboard/department`
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [x] 10.4 Create `app/dashboard/department/[id]/edit/page.tsx`
    - Server Component; server-fetch department (with company); call `notFound()` if null
    - Pass `initialData` including `company_option: { value: department.company.id, label: department.company.name }` to `<DepartmentForm mode="edit" />`
    - _Requirements: 13.5, 13.9_

- [x] 11. Update Sidebar navigation
  - [x] 11.1 Update `components/Sidebar.tsx` to add the Companies parent menu
    - Insert a new `NavItem` entry in `navLinks` between "Blogs" and "Administrator":
      ```typescript
      {
        label: "Companies",
        icon: "🏢",
        children: [
          { href: "/dashboard/companies", label: "Companies", icon: "🏭" },
          { href: "/dashboard/department", label: "Department", icon: "🗂" },
        ],
      }
      ```
    - No logic changes needed — `hasActiveChild` and `toggleMenu` already handle the new entry correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 12. Add react-select CSS overrides to globals.css
  - [x] 12.1 Add minimal `react-select` style overrides to `app/globals.css`
    - Target `.react-select__control` to match the project's `border border-gray-300 rounded-md` input appearance
    - Target `.react-select__control--is-focused` to apply `ring-2 ring-blue-500 border-blue-500` focus style
    - Target `.react-select__menu` for consistent border and shadow
    - _Requirements: 13.2_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- All API routes follow the exact same `getUserIdFromRequest` + Zod + Prisma pattern as `app/api/blogs/`
- `ActiveBadge` and `DeleteDialog` live in `components/company/` and are shared by both `CompanyTable` and `DepartmentTable`
- `react-select` AsyncSelect in `DepartmentForm` calls `/api/companies/options` — Task 4.4 must be complete before Task 9.2
- Property-based tests use **fast-check** with a minimum of 100 iterations per property, tagged with `// Feature: companies-department-crud, Property N: <text>`

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "3.2", "4.1", "7.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "7.2", "7.3"] },
    { "id": 4, "tasks": ["4.5", "7.4", "5.1", "5.2", "11.1"] },
    { "id": 5, "tasks": ["5.3", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3", "10.1", "10.2", "10.3", "10.4", "12.1"] }
  ]
}
```
