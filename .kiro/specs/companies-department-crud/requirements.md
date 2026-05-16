# Requirements Document

## Introduction

This feature adds full CRUD (Create, Read, Update, Delete) management for two master data entities: **Companies** (`mst_companies`) and **Departments** (`mst_department`). Both entities follow the same patterns established by the existing Blog CRUD feature, including soft delete, active/inactive status toggling, JWT-based authentication, Zod validation, and Prisma ORM with MySQL. A new "Companies" parent menu item is added to the sidebar navigation below "Blogs", with child links to the Companies and Department list pages. The Department form includes a searchable company selector powered by `react-select` that fetches options dynamically from the Companies API.

---

## Glossary

- **System**: The Next.js 14 application (workorder-next)
- **CompaniesAPI**: The API route handler at `app/api/companies/`
- **DepartmentAPI**: The API route handler at `app/api/department/`
- **CompaniesPage**: The dashboard page at `app/dashboard/companies/`
- **DepartmentPage**: The dashboard page at `app/dashboard/department/`
- **Sidebar**: The `components/Sidebar.tsx` navigation component
- **CompanyTable**: The client component that renders the companies list with search, sort, and pagination
- **DepartmentTable**: The client component that renders the department list with search, sort, and pagination
- **CompanyForm**: The client component for creating and editing a company record
- **DepartmentForm**: The client component for creating and editing a department record
- **DeleteDialog**: The confirmation modal component used before performing a soft delete
- **ActiveBadge**: The badge component that displays active/inactive status
- **Validator**: The Zod schema validation layer on API routes
- **Authenticator**: The JWT cookie verification utility (`lib/jwt.ts`)
- **PrismaClient**: The Prisma ORM client (`lib/prisma.ts`)
- **mst_companies**: The MySQL database table storing company master data
- **mst_department**: The MySQL database table storing department master data
- **soft delete**: Marking a record as deleted by setting `deleted_at` and `deleted_by` instead of removing the row
- **is_active**: A `tinyint` flag (1 = active, 0 = inactive) used to toggle the operational status of a record
- **react-select**: The third-party React component library used for searchable/async select inputs
- **company_id**: The foreign key in `mst_department` referencing the `id` of `mst_companies`

---

## Requirements

### Requirement 1: Sidebar Navigation — Companies Menu

**User Story:** As a dashboard user, I want a "Companies" parent menu item in the sidebar below "Blogs", so that I can navigate to the Companies and Department management pages.

#### Acceptance Criteria

1. THE Sidebar SHALL render a "Companies" parent menu item positioned immediately below the "Blogs" menu item in the navigation list.
2. THE Sidebar SHALL render two child menu items under "Companies": one labeled "Companies" linking to `/dashboard/companies`, and one labeled "Department" linking to `/dashboard/department`.
3. WHEN the current URL path starts with `/dashboard/companies` or `/dashboard/department`, THE Sidebar SHALL highlight the "Companies" parent menu item as active using the same blue highlight style applied to other active menu items.
4. WHEN the "Companies" parent menu item is clicked, THE Sidebar SHALL toggle the visibility of its child menu items, consistent with the existing collapsible menu behavior.
5. WHILE the sidebar is in collapsed mode, THE Sidebar SHALL display only the icon for the "Companies" parent menu item without the label or child items.

---

### Requirement 2: Database Schema — mst_companies

**User Story:** As a developer, I want a Prisma model for `mst_companies`, so that company master data can be persisted and queried via the ORM.

#### Acceptance Criteria

1. THE PrismaClient SHALL expose a `MstCompany` model mapped to the `mst_companies` table with the following fields: `id` (Int, auto-increment primary key), `code` (String), `name` (String), `legal_name` (String), `alias` (String, optional), `description` (String, optional, Text), `is_active` (Int, default 1), `created_at` (DateTime, default now), `updated_at` (DateTime, auto-updated), `deleted_at` (DateTime, optional), `created_by` (Int, optional), `updated_by` (Int, optional), `deleted_by` (Int, optional).
2. THE PrismaClient SHALL enforce that `code` values are unique within non-deleted `mst_companies` records at the application layer.

---

### Requirement 3: Database Schema — mst_department

**User Story:** As a developer, I want a Prisma model for `mst_department`, so that department master data can be persisted and queried via the ORM.

#### Acceptance Criteria

1. THE PrismaClient SHALL expose a `MstDepartment` model mapped to the `mst_department` table with the following fields: `id` (Int, auto-increment primary key), `company_id` (Int), `code` (String), `name` (String), `description` (String, optional, Text), `department_level` (Int, optional), `department_parent_id` (Int, optional), `is_active` (Int, default 1), `created_at` (DateTime, default now), `updated_at` (DateTime, auto-updated), `deleted_at` (DateTime, optional), `created_by` (Int, optional), `updated_by` (Int, optional), `deleted_by` (Int, optional).
2. THE PrismaClient SHALL define a relation from `MstDepartment.company_id` to `MstCompany.id`.

---

### Requirement 4: Companies API — List and Create

**User Story:** As a dashboard user, I want to list and create company records via API, so that company master data can be managed programmatically.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/companies` with a valid `auth_token` cookie, THE CompaniesAPI SHALL return a paginated JSON response containing `data`, `total`, `page`, `pageSize`, and `totalPages` fields, filtered to exclude soft-deleted records (`deleted_at IS NULL`).
2. WHEN a GET request includes a `search` query parameter, THE CompaniesAPI SHALL filter results to records where `code`, `name`, or `legal_name` contains the search string (case-insensitive).
3. WHEN a GET request includes `sortBy` and `sortOrder` query parameters, THE CompaniesAPI SHALL order results by the specified field in the specified direction, defaulting to `created_at DESC` when parameters are absent or invalid.
4. WHEN a GET request includes a `page` query parameter, THE CompaniesAPI SHALL return the corresponding page of results using a fixed page size of 10 records.
5. WHEN a POST request is made to `/api/companies` with a valid `auth_token` cookie and a valid JSON body, THE CompaniesAPI SHALL create a new `mst_companies` record and return HTTP 201 with the created record.
6. WHEN a POST request body fails Zod validation, THE Validator SHALL return HTTP 400 with an `error` message and a `field` identifier for the first failing field.
7. IF a request to `/api/companies` does not include a valid `auth_token` cookie, THEN THE Authenticator SHALL return HTTP 401 with `{ "error": "Unauthorized" }`.
8. THE Validator SHALL require `code` (non-empty string), `name` (non-empty string), and `legal_name` (non-empty string) for company creation and update operations.

---

### Requirement 5: Companies API — Get, Update, Delete, and Toggle Status

**User Story:** As a dashboard user, I want to retrieve, update, soft-delete, and toggle the active status of a single company record via API, so that individual company records can be fully managed.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/companies/[id]` with a valid `auth_token` cookie, THE CompaniesAPI SHALL return the matching non-deleted company record as JSON, or HTTP 404 if not found.
2. WHEN a PUT request is made to `/api/companies/[id]` with a valid `auth_token` cookie and a valid JSON body, THE CompaniesAPI SHALL update the record and return the updated company as JSON.
3. WHEN a DELETE request is made to `/api/companies/[id]` with a valid `auth_token` cookie, THE CompaniesAPI SHALL perform a soft delete by setting `deleted_at` to the current timestamp and `deleted_by` to the authenticated user's ID, and return HTTP 200.
4. WHEN a PATCH request is made to `/api/companies/[id]/status` with a valid `auth_token` cookie, THE CompaniesAPI SHALL toggle `is_active` between 1 and 0 and return the updated record.
5. IF the `[id]` path parameter is not a valid integer, THEN THE CompaniesAPI SHALL return HTTP 400 with `{ "error": "ID tidak valid" }`.
6. IF a request targets a record that does not exist or has been soft-deleted, THEN THE CompaniesAPI SHALL return HTTP 404 with `{ "error": "Company tidak ditemukan" }`.

---

### Requirement 6: Department API — List and Create

**User Story:** As a dashboard user, I want to list and create department records via API, so that department master data can be managed programmatically.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/department` with a valid `auth_token` cookie, THE DepartmentAPI SHALL return a paginated JSON response containing `data`, `total`, `page`, `pageSize`, and `totalPages` fields, filtered to exclude soft-deleted records.
2. WHEN a GET request includes a `search` query parameter, THE DepartmentAPI SHALL filter results to records where `code` or `name` contains the search string (case-insensitive).
3. WHEN a GET request includes `sortBy` and `sortOrder` query parameters, THE DepartmentAPI SHALL order results by the specified field in the specified direction, defaulting to `created_at DESC`.
4. WHEN a POST request is made to `/api/department` with a valid `auth_token` cookie and a valid JSON body, THE DepartmentAPI SHALL create a new `mst_department` record and return HTTP 201 with the created record.
5. WHEN a POST request body fails Zod validation, THE Validator SHALL return HTTP 400 with an `error` message and a `field` identifier for the first failing field.
6. IF a request to `/api/department` does not include a valid `auth_token` cookie, THEN THE Authenticator SHALL return HTTP 401 with `{ "error": "Unauthorized" }`.
7. THE Validator SHALL require `company_id` (positive integer), `code` (non-empty string), and `name` (non-empty string) for department creation and update operations.

---

### Requirement 7: Department API — Get, Update, Delete, and Toggle Status

**User Story:** As a dashboard user, I want to retrieve, update, soft-delete, and toggle the active status of a single department record via API, so that individual department records can be fully managed.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/department/[id]` with a valid `auth_token` cookie, THE DepartmentAPI SHALL return the matching non-deleted department record as JSON, or HTTP 404 if not found.
2. WHEN a PUT request is made to `/api/department/[id]` with a valid `auth_token` cookie and a valid JSON body, THE DepartmentAPI SHALL update the record and return the updated department as JSON.
3. WHEN a DELETE request is made to `/api/department/[id]` with a valid `auth_token` cookie, THE DepartmentAPI SHALL perform a soft delete by setting `deleted_at` to the current timestamp and `deleted_by` to the authenticated user's ID, and return HTTP 200.
4. WHEN a PATCH request is made to `/api/department/[id]/status` with a valid `auth_token` cookie, THE DepartmentAPI SHALL toggle `is_active` between 1 and 0 and return the updated record.
5. IF the `[id]` path parameter is not a valid integer, THEN THE DepartmentAPI SHALL return HTTP 400 with `{ "error": "ID tidak valid" }`.
6. IF a request targets a record that does not exist or has been soft-deleted, THEN THE DepartmentAPI SHALL return HTTP 404 with `{ "error": "Department tidak ditemukan" }`.

---

### Requirement 8: Companies API — Options Endpoint for Select Input

**User Story:** As a dashboard user filling in the Department form, I want the company selector to load options from the server, so that I can search and select a valid company without knowing all company IDs.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/companies/options` with a valid `auth_token` cookie, THE CompaniesAPI SHALL return a JSON array of objects with `value` (company `id`) and `label` (company `name`) for all non-deleted, active companies.
2. WHEN a GET request to `/api/companies/options` includes a `search` query parameter, THE CompaniesAPI SHALL filter the returned options to companies whose `name` or `code` contains the search string.
3. IF a request to `/api/companies/options` does not include a valid `auth_token` cookie, THEN THE Authenticator SHALL return HTTP 401 with `{ "error": "Unauthorized" }`.

---

### Requirement 9: Companies List Page

**User Story:** As a dashboard user, I want a Companies list page with search, sort, and pagination, so that I can browse and manage all company records.

#### Acceptance Criteria

1. THE CompaniesPage SHALL render a page title "Companies" and an "+ Tambah Company" button linking to `/dashboard/companies/new`.
2. THE CompanyTable SHALL display a table with columns: No, Code, Name, Legal Name, Status (is_active), Created At, and Actions.
3. WHEN the user types in the search input and the value changes, THE CompanyTable SHALL re-fetch the companies list filtered by the search term.
4. WHEN a column header is clicked, THE CompanyTable SHALL toggle the sort direction for that column and re-fetch the list.
5. WHEN the user clicks a pagination button, THE CompanyTable SHALL fetch the corresponding page of results.
6. THE CompanyTable SHALL display an ActiveBadge showing "Active" (green) or "Inactive" (gray) based on the `is_active` value of each record.
7. WHEN the user clicks "Hapus" for a company, THE CompanyTable SHALL display a DeleteDialog confirmation modal before performing the soft delete.
8. WHEN the user confirms deletion in the DeleteDialog, THE CompanyTable SHALL call DELETE `/api/companies/[id]` and refresh the list.
9. WHEN the user clicks the toggle status button for a company, THE CompanyTable SHALL call PATCH `/api/companies/[id]/status` and refresh the list.
10. THE CompanyTable SHALL display action links: "Detail" (→ `/dashboard/companies/[id]`), "Edit" (→ `/dashboard/companies/[id]/edit`), a status toggle button, and a "Hapus" button.

---

### Requirement 10: Companies Create and Edit Pages

**User Story:** As a dashboard user, I want create and edit form pages for companies, so that I can add new companies and update existing ones.

#### Acceptance Criteria

1. THE CompanyForm SHALL render input fields for: `code` (text, required), `name` (text, required), `legal_name` (text, required), `alias` (text, optional), and `description` (textarea, optional).
2. WHEN the user submits the CompanyForm in create mode with valid data, THE CompanyForm SHALL POST to `/api/companies` and redirect to `/dashboard/companies` on success.
3. WHEN the user submits the CompanyForm in edit mode with valid data, THE CompanyForm SHALL PUT to `/api/companies/[id]` and redirect to `/dashboard/companies/[id]` on success.
4. WHEN the API returns a validation error, THE CompanyForm SHALL display the error message below the corresponding field.
5. WHEN the user clicks "Batal", THE CompanyForm SHALL navigate back to `/dashboard/companies` without saving.
6. WHILE the form submission is in progress, THE CompanyForm SHALL disable the submit button and display a loading spinner.

---

### Requirement 11: Companies Detail Page

**User Story:** As a dashboard user, I want a detail view page for a company, so that I can review all fields of a company record before editing or deleting it.

#### Acceptance Criteria

1. THE CompaniesPage detail view SHALL fetch the company record from `/api/companies/[id]` server-side using the `auth_token` cookie.
2. THE CompaniesPage detail view SHALL display all company fields: code, name, legal_name, alias, description, is_active status, and created_at date.
3. THE CompaniesPage detail view SHALL provide an "Edit Company" button linking to `/dashboard/companies/[id]/edit` and a "Kembali" button linking to `/dashboard/companies`.
4. IF the company record is not found or has been soft-deleted, THEN THE CompaniesPage detail view SHALL render a 404 not-found page.

---

### Requirement 12: Department List Page

**User Story:** As a dashboard user, I want a Department list page with search, sort, and pagination, so that I can browse and manage all department records.

#### Acceptance Criteria

1. THE DepartmentPage SHALL render a page title "Department" and an "+ Tambah Department" button linking to `/dashboard/department/new`.
2. THE DepartmentTable SHALL display a table with columns: No, Code, Name, Company, Department Level, Status (is_active), Created At, and Actions.
3. WHEN the user types in the search input, THE DepartmentTable SHALL re-fetch the department list filtered by the search term.
4. WHEN a column header is clicked, THE DepartmentTable SHALL toggle the sort direction for that column and re-fetch the list.
5. WHEN the user clicks a pagination button, THE DepartmentTable SHALL fetch the corresponding page of results.
6. THE DepartmentTable SHALL display an ActiveBadge showing "Active" (green) or "Inactive" (gray) based on the `is_active` value of each record.
7. WHEN the user clicks "Hapus" for a department, THE DepartmentTable SHALL display a DeleteDialog confirmation modal before performing the soft delete.
8. WHEN the user confirms deletion, THE DepartmentTable SHALL call DELETE `/api/department/[id]` and refresh the list.
9. WHEN the user clicks the toggle status button, THE DepartmentTable SHALL call PATCH `/api/department/[id]/status` and refresh the list.
10. THE DepartmentTable SHALL display action links: "Detail" (→ `/dashboard/department/[id]`), "Edit" (→ `/dashboard/department/[id]/edit`), a status toggle button, and a "Hapus" button.

---

### Requirement 13: Department Create and Edit Pages

**User Story:** As a dashboard user, I want create and edit form pages for departments, so that I can add new departments and update existing ones.

#### Acceptance Criteria

1. THE DepartmentForm SHALL render input fields for: `code` (text, required), `name` (text, required), `description` (textarea, optional), `department_level` (number, optional), and `department_parent_id` (number, optional).
2. THE DepartmentForm SHALL render a `company_id` field using a `react-select` async searchable select component that fetches options from `/api/companies/options`.
3. WHEN the user types in the `react-select` company input, THE DepartmentForm SHALL call `/api/companies/options?search=[query]` and display the matching company options as a dropdown.
4. WHEN the user submits the DepartmentForm in create mode with valid data, THE DepartmentForm SHALL POST to `/api/department` and redirect to `/dashboard/department` on success.
5. WHEN the user submits the DepartmentForm in edit mode with valid data, THE DepartmentForm SHALL PUT to `/api/department/[id]` and redirect to `/dashboard/department/[id]` on success.
6. WHEN the API returns a validation error, THE DepartmentForm SHALL display the error message below the corresponding field.
7. WHEN the user clicks "Batal", THE DepartmentForm SHALL navigate back to `/dashboard/department` without saving.
8. WHILE the form submission is in progress, THE DepartmentForm SHALL disable the submit button and display a loading spinner.
9. WHEN the DepartmentForm is in edit mode, THE DepartmentForm SHALL pre-populate the `react-select` company field with the existing company name and ID.

---

### Requirement 14: Department Detail Page

**User Story:** As a dashboard user, I want a detail view page for a department, so that I can review all fields of a department record.

#### Acceptance Criteria

1. THE DepartmentPage detail view SHALL fetch the department record from `/api/department/[id]` server-side using the `auth_token` cookie.
2. THE DepartmentPage detail view SHALL display all department fields: code, name, company name (resolved from `company_id`), description, department_level, department_parent_id, is_active status, and created_at date.
3. THE DepartmentPage detail view SHALL provide an "Edit Department" button linking to `/dashboard/department/[id]/edit` and a "Kembali" button linking to `/dashboard/department`.
4. IF the department record is not found or has been soft-deleted, THEN THE DepartmentPage detail view SHALL render a 404 not-found page.

---

### Requirement 15: Soft Delete Consistency

**User Story:** As a developer, I want all delete operations to use the soft delete pattern consistently, so that data is never permanently lost and audit trails are preserved.

#### Acceptance Criteria

1. WHEN a delete operation is performed on any `mst_companies` or `mst_department` record, THE System SHALL set `deleted_at` to the current UTC timestamp and `deleted_by` to the authenticated user's ID.
2. THE CompaniesAPI and DepartmentAPI SHALL exclude records where `deleted_at IS NOT NULL` from all list and single-record GET responses.
3. THE CompaniesAPI and DepartmentAPI SHALL reject PUT, PATCH, and DELETE requests targeting a soft-deleted record with HTTP 404.

---

### Requirement 16: Authentication Guard on All Routes

**User Story:** As a system administrator, I want all Companies and Department API routes to require authentication, so that unauthenticated users cannot access or modify master data.

#### Acceptance Criteria

1. WHEN any request is made to `/api/companies/**` or `/api/department/**` without a valid `auth_token` cookie, THE Authenticator SHALL return HTTP 401 with `{ "error": "Unauthorized" }`.
2. THE System SHALL use the same `getUserIdFromRequest` pattern (reading `auth_token` cookie and calling `verifyToken`) as the existing Blog API routes.
